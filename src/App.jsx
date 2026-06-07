import { useRef, useEffect, useState, useCallback } from 'react'
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'

import {
  STOP_SIGNS,
  STOP_SIGNS_SENTENCE,
  TRIMESTER_RULES,
  VARIATION_RULES,
  VARIATION_LABELS,
  PREGNANCY_PHRASES,
  STATUS_COLORS,
  STANDING_ANGLE,
  LM,
  getRules,
  getPoseMetrics,
  getFormCues,
  pickCue,
  statusFromCues,
  bodyVisible,
} from './pregnancyRules'
import { precacheAudio, playAudio, speakText } from './audio'
import { transcribeSpeech } from './services/elevenlabs'
import { matchFaq } from './faq'

// --- Session constants ------------------------------------------------------

const REPS_PER_SET = 10
const TOTAL_SETS = 3
const CUE_COOLDOWN = 7000 // 3s between any audio cues, just changed to 7s

// --- Skeleton drawing -------------------------------------------------------

function drawSkeleton(ctx, landmarks, color) {
  drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { color, lineWidth: 3 })
  drawLandmarks(ctx, landmarks, {
    color: '#ffffff',
    fillColor: color,
    lineWidth: 1,
    radius: 4,
  })
  // Emphasize the knees — they drive the most important cues.
  drawLandmarks(ctx, [landmarks[LM.LEFT_KNEE], landmarks[LM.RIGHT_KNEE]], {
    color,
    fillColor: color,
    lineWidth: 2,
    radius: 8,
  })
}

// ============================================================================
// Component
// ============================================================================

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraRef = useRef(null)
  const poseRef = useRef(null)
  const mountedRef = useRef(true)

  // Live-read refs so the rapid MediaPipe callback always sees current values.
  const rulesRef = useRef(null)
  const lastCueTime = useRef(0)
  const lastBreathTime = useRef(0)
  const prevKneeRef = useRef(null)
  const repPhaseRef = useRef('standing') // 'standing' | 'down'
  const reachedDepthRef = useRef(false)
  const repsRef = useRef(0)
  const setsDoneRef = useRef(0)
  const frameCount = useRef(0)

  // Between-sets voice Q&A
  const qaActiveRef = useRef(false)   // pauses analysis while the Q&A panel is open
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const micStreamRef = useRef(null)

  // --- Flow / UI state ---
  const [screen, setScreen] = useState('disclaimer') // disclaimer|setup|instructions|coaching|complete
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const [trimester, setTrimester] = useState(null)
  const [variation, setVariation] = useState(null)
  const [showStopSigns, setShowStopSigns] = useState(false)
  const [loading, setLoading] = useState(true)

  const [session, setSession] = useState({
    reps: 0,
    set: 1,
  })
  // Q&A panel: active + phase ('idle'|'recording'|'transcribing'|'answering') + text
  const [qa, setQa] = useState({
    active: false,
    completedSet: 0,
    phase: 'idle',
    transcript: '',
    answer: '',
  })
  const [status, setStatus] = useState({
    kneeAngle: '--',
    hipAngle: '--',
    cue: 'none',
    color: STATUS_COLORS.good,
    tracked: false,
  })

  // Keep the merged rule set fresh for the analysis callback.
  useEffect(() => {
    if (trimester && variation) rulesRef.current = getRules(trimester, variation)
  }, [trimester, variation])

  // --- Audio cue gate (3s global cooldown) ---
  const playCue = useCallback((key, { bypassCooldown = false } = {}) => {
    const now = Date.now()
    if (!bypassCooldown && now - lastCueTime.current < CUE_COOLDOWN) return false
    lastCueTime.current = now
    playAudio(key)
    return true
  }, [])

  // --- Between-sets Q&A: pause analysis and offer a spoken question prompt ---
  const enterQA = useCallback(() => {
    const completedSet = setsDoneRef.current + 1
    qaActiveRef.current = true
    setSession((s) => ({ ...s, reps: REPS_PER_SET }))
    setQa({ active: true, completedSet, phase: 'idle', transcript: '', answer: '' })
    speakText(
      `Set ${completedSet} done, nice work! Any questions for me? ` +
        `Tap the microphone to ask, or continue when you're ready.`
    )
  }, [])

  // --- Per-frame analysis (stable; reads everything from refs) ---
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    const lm = results.poseLandmarks
    if (!lm) {
      if (mountedRef.current) setStatus((s) => ({ ...s, tracked: false }))
      return
    }

    const tracked = bodyVisible(lm)

    // Paused for the between-sets Q&A — keep drawing the skeleton, skip analysis.
    if (qaActiveRef.current) {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-w, 0)
      drawSkeleton(ctx, lm, STATUS_COLORS.good)
      ctx.restore()
      return
    }

    const rules = rulesRef.current
    if (!rules) return

    const metrics = getPoseMetrics(lm)
    const cues = tracked ? getFormCues(metrics, rules, prevKneeRef.current) : []
    const statusKey = statusFromCues(cues)
    const color = STATUS_COLORS[statusKey]

    // Draw mirrored skeleton in the severity color.
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-w, 0)
    drawSkeleton(ctx, lm, tracked ? color : '#888')
    ctx.restore()

    if (!tracked) {
      if (mountedRef.current) setStatus((s) => ({ ...s, tracked: false }))
      return
    }

    const now = Date.now()

    // --- Rep state machine: standing -> good depth -> standing = 1 rep ---
    const { avgKnee } = metrics
    if (avgKnee > STANDING_ANGLE) {
      if (repPhaseRef.current === 'down' && reachedDepthRef.current) {
        repsRef.current += 1
        reachedDepthRef.current = false
        if (repsRef.current >= REPS_PER_SET) {
          // Set complete — open the between-sets Q&A. The set advances (or the
          // session finishes) when the user taps "continue" in continueFromQA.
          enterQA()
        } else {
          setSession((s) => ({ ...s, reps: repsRef.current }))
        }
      }
      repPhaseRef.current = 'standing'
    } else {
      repPhaseRef.current = 'down'
      if (avgKnee >= rules.minKnee && avgKnee <= rules.maxKnee) {
        reachedDepthRef.current = true
      }
    }

    // --- Breath reminder (time-based, regardless of form) ---
    const breathDue = now - lastBreathTime.current >= rules.breathInterval
    const candidateCues = breathDue ? [...cues, 'remember_to_breathe'] : cues

    // --- Pick + speak one cue, respecting priority + cooldown ---
    const chosen = pickCue(candidateCues)
    if (chosen) {
      const fired = playCue(chosen)
      if (fired && chosen === 'remember_to_breathe') lastBreathTime.current = now
    }

    prevKneeRef.current = avgKnee

    // Throttle the metrics overlay (~10Hz) to avoid flooding React.
    frameCount.current += 1
    if (frameCount.current % 6 === 0 && mountedRef.current) {
      setStatus({
        kneeAngle: avgKnee.toFixed(0),
        hipAngle: metrics.hipAngle.toFixed(0),
        cue: chosen ?? 'none',
        color,
        tracked: true,
      })
    }
  }, [playCue, enterQA])

  // --- Camera lifecycle: only runs on the coaching screen ---
  useEffect(() => {
    if (screen !== 'coaching') return
    mountedRef.current = true

    // Reset the whole session.
    repsRef.current = 0
    setsDoneRef.current = 0
    reachedDepthRef.current = false
    repPhaseRef.current = 'standing'
    prevKneeRef.current = null
    lastCueTime.current = 0
    lastBreathTime.current = Date.now()
    qaActiveRef.current = false
    setSession({ reps: 0, set: 1 })
    setQa({ active: false, completedSet: 0, phase: 'idle', transcript: '', answer: '' })
    setLoading(true)

    precacheAudio() // session start

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
    })
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    pose.onResults(onResults)
    poseRef.current = pose

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && poseRef.current) {
          await poseRef.current.send({ image: videoRef.current })
        }
      },
      width: 640,
      height: 480,
    })
    camera.start().then(() => {
      if (mountedRef.current) setLoading(false)
    })
    cameraRef.current = camera

    return () => {
      mountedRef.current = false
      try {
        cameraRef.current?.stop()
        poseRef.current?.close()
        micStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch (e) {
        console.warn('[cleanup]', e)
      }
    }
  }, [screen, onResults])

  // --- Q&A push-to-talk handlers ---
  const onRecordingStop = async () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    const type = mediaRecorderRef.current?.mimeType || 'audio/webm'
    const blob = new Blob(audioChunksRef.current, { type })

    setQa((q) => ({ ...q, phase: 'transcribing' }))
    const transcript = await transcribeSpeech(blob)
    if (!transcript) {
      setQa((q) => ({
        ...q,
        phase: 'idle',
        transcript: '',
        answer: "I didn't catch that — tap the mic and try again.",
      }))
      return
    }

    const { answer } = matchFaq(transcript)
    setQa((q) => ({ ...q, phase: 'answering', transcript, answer }))
    await speakText(answer)
    setQa((q) => ({ ...q, phase: 'idle' }))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const mr = new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) audioChunksRef.current.push(e.data) }
      mr.onstop = onRecordingStop
      mediaRecorderRef.current = mr
      mr.start()
      setQa((q) => ({ ...q, phase: 'recording', transcript: '', answer: '' }))
    } catch (e) {
      console.warn('[mic] error', e)
      setQa((q) => ({
        ...q,
        phase: 'idle',
        answer: 'I could not access the microphone — check your browser permissions.',
      }))
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') mr.stop()
  }

  // --- Handlers ---
  const continueFromQA = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') { mr.onstop = null; mr.stop() }
    micStreamRef.current?.getTracks().forEach((t) => t.stop())

    setsDoneRef.current += 1
    repsRef.current = 0
    reachedDepthRef.current = false
    repPhaseRef.current = 'standing'
    prevKneeRef.current = null
    lastBreathTime.current = Date.now()
    qaActiveRef.current = false
    setQa({ active: false, completedSet: 0, phase: 'idle', transcript: '', answer: '' })

    if (setsDoneRef.current >= TOTAL_SETS) {
      setScreen('complete')
    } else {
      setSession((s) => ({ ...s, reps: 0, set: setsDoneRef.current + 1 }))
    }
  }

  const handleStop = () => {
    qaActiveRef.current = false
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    setQa({ active: false, completedSet: 0, phase: 'idle', transcript: '', answer: '' })
    setScreen('setup')
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  if (screen === 'disclaimer') {
    return (
      <DisclaimerScreen
        checked={disclaimerChecked}
        onCheck={setDisclaimerChecked}
        onContinue={() => setScreen('setup')}
      />
    )
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        trimester={trimester}
        variation={variation}
        onTrimester={setTrimester}
        onVariation={setVariation}
        onContinue={() => setScreen('instructions')}
        onShowStopSigns={() => setShowStopSigns(true)}
        showStopSigns={showStopSigns}
        onHideStopSigns={() => setShowStopSigns(false)}
      />
    )
  }

  if (screen === 'instructions') {
    return (
      <InstructionsScreen
        variation={variation}
        onBack={() => setScreen('setup')}
        onStart={() => setScreen('coaching')}
      />
    )
  }

  if (screen === 'complete') {
    return (
      <CompleteScreen
        onRestart={() => setScreen('setup')}
        onShowStopSigns={() => setShowStopSigns(true)}
        showStopSigns={showStopSigns}
        onHideStopSigns={() => setShowStopSigns(false)}
      />
    )
  }

  // --- Coaching screen ---
  return (
    <div style={S.page}>
      <TopBar
        trimester={trimester}
        variation={variation}
        session={session}
        onShowStopSigns={() => setShowStopSigns(true)}
      />

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          style={{
            display: 'block',
            transform: 'scaleX(-1)',
            borderRadius: 12,
            maxWidth: '92vw',
          }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 12,
          }}
        />

        {loading && (
          <div style={S.veil}>Loading camera & model…</div>
        )}

        {!loading && !status.tracked && !qa.active && (
          <div style={S.trackingHint}>
            Step back so your whole body — head to feet — is in frame
          </div>
        )}

        {/* Active coaching cue */}
        {!qa.active && status.cue !== 'none' && (
          <div style={{ ...S.cueBanner, borderColor: status.color, color: status.color }}>
            {PREGNANCY_PHRASES[status.cue]}
          </div>
        )}

        {/* Between-sets voice Q&A */}
        {qa.active && (
          <div style={S.qaOverlay}>
            <div style={S.qaTitle}>Set {qa.completedSet} done! 🎉</div>
            <div style={S.qaSub}>Any questions? Tap the mic to ask — or continue.</div>

            <button
              style={{ ...S.micButton, ...(qa.phase === 'recording' ? S.micButtonRec : {}) }}
              onClick={qa.phase === 'recording' ? stopRecording : startRecording}
              disabled={qa.phase === 'transcribing' || qa.phase === 'answering'}
            >
              {qa.phase === 'recording'
                ? '■ Stop & send'
                : qa.phase === 'transcribing'
                ? 'Transcribing…'
                : qa.phase === 'answering'
                ? 'Answering…'
                : '🎤 Tap to ask'}
            </button>

            {qa.transcript && <div style={S.qaYou}>“{qa.transcript}”</div>}
            {qa.answer && <div style={S.qaAnswer}>{qa.answer}</div>}

            <button style={S.qaContinue} onClick={continueFromQA}>
              {qa.completedSet >= TOTAL_SETS ? 'Finish session' : 'Continue to next set →'}
            </button>
          </div>
        )}

        {/* Metrics */}
        <div style={S.metrics}>
          <div>knee <span style={{ color: status.color }}>{status.kneeAngle}°</span></div>
          <div>hip <span style={{ color: '#69f0ae' }}>{status.hipAngle}°</span></div>
        </div>
      </div>

      <button style={S.stopButton} onClick={handleStop}>■ STOP</button>

      {showStopSigns && <StopSignsPanel onClose={() => setShowStopSigns(false)} />}
    </div>
  )
}

// ============================================================================
// Screens & pieces
// ============================================================================

function DisclaimerScreen({ checked, onCheck, onContinue }) {
  return (
    <div style={S.centered}>
      <div style={S.card}>
        <h1 style={S.h1}>Pregnancy Squat Coach</h1>
        <p style={S.lede}>
          A gentle, camera-based form coach for prenatal squats — grounded in
          ACOG and Healthline guidance.
        </p>

        <div style={S.disclaimerBox}>
          <h2 style={S.h2}>Before you begin</h2>
          <p style={S.body}>
            This tool offers general form feedback only. It is not medical
            advice and is not a substitute for your healthcare provider. Always
            get clearance to exercise during pregnancy.
          </p>
          <p style={{ ...S.body, color: '#ff8a80', fontWeight: 600 }}>
            {STOP_SIGNS_SENTENCE}
          </p>
        </div>

        <label style={S.checkRow}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span>
            I’ve read the warning signs above and have my provider’s clearance
            to exercise.
          </span>
        </label>

        <button
          style={{ ...S.primary, ...(checked ? {} : S.disabled) }}
          disabled={!checked}
          onClick={onContinue}
        >
          I understand — continue
        </button>
      </div>
    </div>
  )
}

function SetupScreen({
  trimester, variation, onTrimester, onVariation, onContinue,
  onShowStopSigns, showStopSigns, onHideStopSigns,
}) {
  const ready = trimester && variation
  return (
    <div style={S.centered}>
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h1 style={S.h1}>Set up your session</h1>
          <HelpIcon onClick={onShowStopSigns} />
        </div>

        <h2 style={S.h2}>Which trimester are you in?</h2>
        <div style={S.optionRow}>
          {[1, 2, 3].map((t) => (
            <OptionButton
              key={t}
              selected={trimester === t}
              onClick={() => onTrimester(t)}
              title={`${ordinal(t)} trimester`}
              subtitle={`depth ${TRIMESTER_RULES[t].minKnee}–${TRIMESTER_RULES[t].maxKnee}°`}
            />
          ))}
        </div>

        <h2 style={S.h2}>Squat variation</h2>
        <div style={S.optionRow}>
          {Object.keys(VARIATION_RULES).map((v) => (
            <OptionButton
              key={v}
              selected={variation === v}
              onClick={() => onVariation(v)}
              title={VARIATION_LABELS[v]}
              subtitle={variationHint(v)}
            />
          ))}
        </div>

        <button
          style={{ ...S.primary, ...(ready ? {} : S.disabled) }}
          disabled={!ready}
          onClick={onContinue}
        >
          Next: how to stand
        </button>
      </div>

      {showStopSigns && <StopSignsPanel onClose={onHideStopSigns} />}
    </div>
  )
}

function InstructionsScreen({ variation, onBack, onStart }) {
  const steps = [
    'Place your phone or laptop about 6–8 feet away on a stable surface, roughly hip height.',
    'Make sure your whole body — head to feet — fits inside the frame, with room to squat.',
    'Stand facing the camera, then turn a quarter-turn so your side is partly visible. This lets the coach see your knees relative to your toes.',
    'Use bright, even lighting. Avoid a window or bright light directly behind you.',
    'Wear fitted clothing so your hips, knees, and ankles are easy to track.',
    'Clear the space around you and keep a sturdy chair within reach for balance.',
  ]
  if (variation === 'chair') {
    steps.push('Position a stable, non-rolling chair behind you — sit back lightly to it at the bottom of each squat.')
  }
  if (variation === 'sumo') {
    steps.push('Set your feet wide and point your toes out about 30–45°; track your knees over your toes.')
  }

  return (
    <div style={S.centered}>
      <div style={S.card}>
        <h1 style={S.h1}>How to stand for accurate tracking</h1>
        <p style={S.lede}>
          A few seconds of setup makes the form feedback far more reliable.
        </p>
        <ol style={S.steps}>
          {steps.map((s, i) => (
            <li key={i} style={S.step}>{s}</li>
          ))}
        </ol>
        <p style={{ ...S.body, color: '#888' }}>
          Move slowly and stay within a comfortable range. The coach will never
          ask you to go deeper than feels good.
        </p>
        <div style={S.buttonRow}>
          <button style={S.secondary} onClick={onBack}>Back</button>
          <button style={S.primary} onClick={onStart}>Start squats</button>
        </div>
      </div>
    </div>
  )
}

function CompleteScreen({ onRestart, onShowStopSigns, showStopSigns, onHideStopSigns }) {
  return (
    <div style={S.centered}>
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h1 style={S.h1}>Great work! 🎉</h1>
          <HelpIcon onClick={onShowStopSigns} />
        </div>
        <p style={S.lede}>
          You finished all {TOTAL_SETS} sets. Hydrate, rest, and check in with
          how your body feels.
        </p>
        <p style={{ ...S.body, color: '#ff8a80' }}>{STOP_SIGNS_SENTENCE}</p>
        <button style={S.primary} onClick={onRestart}>Start another session</button>
      </div>
      {showStopSigns && <StopSignsPanel onClose={onHideStopSigns} />}
    </div>
  )
}

function TopBar({ trimester, variation, session, onShowStopSigns }) {
  return (
    <div style={S.topBar}>
      <div style={S.badge}>
        {ordinal(trimester)} trimester · {VARIATION_LABELS[variation]}
      </div>
      <div style={S.counters}>
        <span style={S.counter}>Set <b>{session.set}</b>/{TOTAL_SETS}</span>
        <span style={S.counter}>Reps <b>{session.reps}</b>/{REPS_PER_SET}</span>
        <span style={S.counterSub}>aim for 10–15 / set</span>
      </div>
      <HelpIcon onClick={onShowStopSigns} />
    </div>
  )
}

function StopSignsPanel({ onClose }) {
  return (
    <div style={S.modalBackdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ ...S.h2, color: '#ff8a80', marginTop: 0 }}>Stop immediately if you feel…</h2>
        <ul style={S.stopList}>
          {STOP_SIGNS.map((s) => (
            <li key={s} style={S.stopItem}>{s}</li>
          ))}
        </ul>
        <p style={{ ...S.body, color: '#bbb' }}>
          …and contact your healthcare provider.
        </p>
        <button style={S.secondary} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

function OptionButton({ selected, onClick, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      style={{ ...S.option, ...(selected ? S.optionSelected : {}) }}
    >
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 12, color: selected ? '#0a2a1a' : '#888' }}>{subtitle}</span>
    </button>
  )
}

function HelpIcon({ onClick }) {
  return (
    <button onClick={onClick} style={S.help} title="Warning signs to stop" aria-label="Warning signs to stop">
      ?
    </button>
  )
}

// --- Small text helpers ---
function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}
function variationHint(v) {
  if (v === 'bodyweight') return 'shoulder-width'
  if (v === 'sumo') return 'wide, toes out'
  if (v === 'chair') return 'sit back to a chair'
  return ''
}

// ============================================================================
// Styles (inline so no CSS file is needed)
// ============================================================================

const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

const S = {
  page: {
    background: '#111', minHeight: '100vh', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
    gap: 14, padding: '16px 0 24px', fontFamily: FONT, color: '#eee',
  },
  centered: {
    background: '#111', minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 16,
    fontFamily: FONT, color: '#eee',
  },
  card: {
    background: '#1b1b1f', border: '1px solid #2c2c33', borderRadius: 16,
    padding: 28, maxWidth: 560, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,.4)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 26, fontWeight: 700, margin: '0 0 8px' },
  h2: { fontSize: 15, fontWeight: 600, margin: '20px 0 10px', color: '#cfcfd6' },
  lede: { fontSize: 15, lineHeight: 1.5, color: '#b8b8c0', margin: '0 0 12px' },
  body: { fontSize: 14, lineHeight: 1.6, margin: '0 0 10px' },
  disclaimerBox: {
    background: '#241417', border: '1px solid #5a2730', borderRadius: 12,
    padding: 16, margin: '12px 0 18px',
  },
  checkRow: {
    display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14,
    lineHeight: 1.5, margin: '4px 0 20px', cursor: 'pointer', color: '#ddd',
  },
  steps: { margin: '8px 0 16px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 10 },
  step: { fontSize: 14, lineHeight: 1.5, color: '#d2d2d8' },

  optionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  option: {
    flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 4,
    alignItems: 'flex-start', background: '#26262c', border: '1px solid #3a3a42',
    borderRadius: 12, padding: '12px 14px', cursor: 'pointer', color: '#eee',
    textAlign: 'left',
  },
  optionSelected: { background: STATUS_COLORS.good, color: '#0a2a1a', borderColor: STATUS_COLORS.good },

  primary: {
    width: '100%', marginTop: 8, padding: '14px 18px', fontSize: 16, fontWeight: 600,
    background: '#7c4dff', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
  },
  secondary: {
    padding: '12px 18px', fontSize: 15, fontWeight: 600, background: '#2c2c33',
    color: '#eee', border: '1px solid #3a3a42', borderRadius: 12, cursor: 'pointer',
  },
  disabled: { opacity: 0.4, cursor: 'not-allowed' },
  buttonRow: { display: 'flex', gap: 12, marginTop: 8 },

  topBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    justifyContent: 'center', maxWidth: '92vw',
  },
  badge: {
    background: '#2a1f4d', color: '#c9b8ff', border: '1px solid #463088',
    borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600,
  },
  counters: { display: 'flex', alignItems: 'baseline', gap: 12 },
  counter: { fontSize: 15, color: '#eee' },
  counterSub: { fontSize: 11, color: '#777' },

  veil: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,0,0,.8)', borderRadius: 12,
    color: '#aaa', fontSize: 15,
  },
  trackingHint: {
    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(40,30,0,.85)', border: '1px solid #b58900', color: '#ffd54f',
    borderRadius: 10, padding: '8px 14px', fontSize: 14, textAlign: 'center',
    maxWidth: '80%',
  },
  cueBanner: {
    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,.78)', border: '2px solid', borderRadius: 12,
    padding: '10px 18px', fontSize: 17, fontWeight: 600, textAlign: 'center',
    maxWidth: '85%',
  },
  metrics: {
    position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,.65)',
    border: '1px solid #333', borderRadius: 8, padding: '8px 12px',
    fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none',
  },

  qaOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
    background: 'rgba(10,10,14,.9)', borderRadius: 12, padding: 24, textAlign: 'center',
  },
  qaTitle: { fontSize: 26, fontWeight: 700, color: '#fff' },
  qaSub: { fontSize: 15, color: '#b8b8c0' },
  micButton: {
    padding: '16px 30px', fontSize: 18, fontWeight: 700, borderRadius: 999,
    border: '2px solid #7c4dff', background: '#7c4dff', color: '#fff', cursor: 'pointer',
    minWidth: 200,
  },
  micButtonRec: { background: '#d50000', borderColor: '#d50000' },
  qaYou: {
    fontSize: 15, fontStyle: 'italic', color: '#c9b8ff', maxWidth: '80%',
  },
  qaAnswer: {
    fontSize: 17, lineHeight: 1.5, color: '#eafff0', maxWidth: '85%',
    background: 'rgba(0,230,118,.1)', border: '1px solid #2e7d52',
    borderRadius: 12, padding: '12px 16px',
  },
  qaContinue: {
    marginTop: 4, padding: '12px 22px', fontSize: 16, fontWeight: 600,
    background: '#2c2c33', color: '#eee', border: '1px solid #3a3a42',
    borderRadius: 12, cursor: 'pointer',
  },

  stopButton: {
    background: '#d50000', color: '#fff', border: 'none', borderRadius: 14,
    padding: '16px 48px', fontSize: 20, fontWeight: 800, letterSpacing: 1,
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(213,0,0,.5)',
  },

  help: {
    width: 30, height: 30, borderRadius: '50%', border: '1px solid #555',
    background: '#26262c', color: '#ccc', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', flexShrink: 0,
  },

  modalBackdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
  },
  modal: {
    background: '#1b1b1f', border: '1px solid #5a2730', borderRadius: 16,
    padding: 24, maxWidth: 420, width: '100%', fontFamily: FONT, color: '#eee',
  },
  stopList: {
    columns: 2, gap: 16, margin: '6px 0 12px', paddingLeft: 20,
    fontSize: 14, lineHeight: 1.9,
  },
  stopItem: { color: '#ffcdd2' },
}
