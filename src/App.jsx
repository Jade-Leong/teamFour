import { useRef, useEffect, useState, useCallback } from 'react'
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'

// --- Pure math helpers ---

function getAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(radians * (180 / Math.PI))
  if (angle > 180) angle = 360 - angle
  return angle
}

// --- Placeholder — ElevenLabs wiring comes later ---
function playAudio(cueKey) {
  console.log('[playAudio]', cueKey)
}

// --- Squat analysis ---

function analyzeSquatAngles(lm) {
  const leftKneeAngle  = getAngle({ x: lm[23].x, y: lm[23].y },
                                   { x: lm[25].x, y: lm[25].y },
                                   { x: lm[27].x, y: lm[27].y })

  const rightKneeAngle = getAngle({ x: lm[24].x, y: lm[24].y },
                                   { x: lm[26].x, y: lm[26].y },
                                   { x: lm[28].x, y: lm[28].y })

  const hipAngle       = getAngle({ x: lm[11].x, y: lm[11].y },
                                   { x: lm[23].x, y: lm[23].y },
                                   { x: lm[25].x, y: lm[25].y })

  return { leftKneeAngle, rightKneeAngle, hipAngle }
}

function getSquatCue(leftKneeAngle, rightKneeAngle, hipAngle) {
  const avgKnee = (leftKneeAngle + rightKneeAngle) / 2
  const isInSquat = avgKnee < 160

  if (!isInSquat) return null

  if (avgKnee > 110)                               return 'go_deeper'
  if (Math.abs(leftKneeAngle - rightKneeAngle) > 15) return 'knees_caving'
  if (hipAngle < 50)                               return 'chest_up'
  return 'good_form'
}

// --- Drawing helpers ---

const SKELETON_COLOR = '#00e5ff'
const JOINT_COLOR    = '#ff1744'

function drawSkeleton(ctx, landmarks) {
  drawConnectors(ctx, landmarks, POSE_CONNECTIONS, {
    color: SKELETON_COLOR,
    lineWidth: 2,
  })
  drawLandmarks(ctx, landmarks, {
    color: JOINT_COLOR,
    lineWidth: 1,
    radius: 4,
  })
}

// --- Status overlay styles (inline so no CSS file needed) ---

const overlayStyle = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  background: 'rgba(0,0,0,0.7)',
  border: '1px solid #333',
  borderRadius: 8,
  padding: '10px 16px',
  fontFamily: 'monospace',
  fontSize: 13,
  lineHeight: 1.8,
  color: '#eee',
  pointerEvents: 'none',
  userSelect: 'none',
}

const CUE_COLORS = {
  good_form:    '#00e676',
  go_deeper:    '#ff9100',
  knees_caving: '#ff1744',
  chest_up:     '#d500f9',
  none:         '#888',
}

// --- Component ---

export default function App() {
  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const lastCueTime   = useRef(0)
  const frameCount    = useRef(0)
  const cameraRef     = useRef(null)
  const poseRef       = useRef(null)
  const mountedRef    = useRef(true)

  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState({
    kneeAngle: '--',
    hipAngle:  '--',
    lastCue:   'none',
    inSquat:   false,
  })

  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas || !video) return

    const w = video.videoWidth  || 640
    const h = video.videoHeight || 480

    if (canvas.width !== w)  canvas.width  = w
    if (canvas.height !== h) canvas.height = h

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    if (!results.poseLandmarks) return

    // Mirror the canvas draw to match the mirrored video display
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-w, 0)
    drawSkeleton(ctx, results.poseLandmarks)
    ctx.restore()

    const { leftKneeAngle, rightKneeAngle, hipAngle } =
      analyzeSquatAngles(results.poseLandmarks)

    const avgKnee  = (leftKneeAngle + rightKneeAngle) / 2
    const inSquat  = avgKnee < 160
    const cue      = getSquatCue(leftKneeAngle, rightKneeAngle, hipAngle)

    // Log every frame for calibration
    console.log(
      `[Angles] leftKnee=${leftKneeAngle.toFixed(1)}  rightKnee=${rightKneeAngle.toFixed(1)}  hip=${hipAngle.toFixed(1)}  inSquat=${inSquat}  cue=${cue ?? 'none'}`
    )

    // Cooldown gate: only fire a non-null cue if 3s have passed
    const now = Date.now()
    if (cue && now - lastCueTime.current >= 3000) {
      lastCueTime.current = now
      console.log(`[Cue fired] ${cue} at ${new Date(now).toISOString()}`)
      playAudio(cue)
    }

    // Throttle React state updates to every 6 frames (~10Hz @ 60fps) to
    // avoid flooding the renderer while keeping the overlay responsive
    frameCount.current += 1
    if (frameCount.current % 6 === 0 && mountedRef.current) {
      setStatus({
        kneeAngle: avgKnee.toFixed(1),
        hipAngle:  hipAngle.toFixed(1),
        lastCue:   cue ?? 'none',
        inSquat,
      })
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

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
      cameraRef.current?.stop()
      poseRef.current?.close()
    }
  }, [onResults])

  return (
    <div style={{
      background: '#111',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <h1 style={{
        fontFamily: 'monospace',
        fontSize: 16,
        color: '#555',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        Squat Form Analyzer
      </h1>

      {/* Camera + canvas wrapper */}
      <div style={{ position: 'relative', display: 'inline-block' }}>

        {/* Video mirrored via CSS so it looks like a mirror */}
        <video
          ref={videoRef}
          style={{
            display: 'block',
            transform: 'scaleX(-1)',
            borderRadius: 8,
            maxWidth: '90vw',
          }}
          playsInline
          muted
        />

        {/* Canvas sits on top; landmark drawing is also mirrored inside onResults */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 8,
          }}
        />

        {/* Loading veil */}
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 8,
            fontFamily: 'monospace',
            color: '#555',
            fontSize: 14,
          }}>
            Loading model…
          </div>
        )}

        {/* Status overlay */}
        <div style={overlayStyle}>
          <div>
            knee angle{' '}
            <span style={{ color: '#00e5ff' }}>{status.kneeAngle}°</span>
            {status.inSquat && (
              <span style={{ marginLeft: 8, color: '#ff9100', fontSize: 11 }}>
                IN SQUAT
              </span>
            )}
          </div>
          <div>
            hip angle{' '}
            <span style={{ color: '#69f0ae' }}>{status.hipAngle}°</span>
          </div>
          <div>
            cue{' '}
            <span style={{ color: CUE_COLORS[status.lastCue] ?? '#888' }}>
              {status.lastCue}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
