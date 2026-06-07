import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, X, Sparkles, Play, Pause, Camera as CameraIcon, Mic } from "lucide-react";
import { useUserProfile, type LastSession } from "@/context/UserProfileContext";
import {
  PREGNANCY_PHRASES,
  STANDING_ANGLE,
  STATUS_COLORS,
  IMPACT_VELOCITY_THRESHOLD,
  IMPACT_WARNING_COOLDOWN,
  bodyVisible,
  formReferenceFor,
  getFormCues,
  getPoseMetrics,
  getRules,
  getTorsoMotionSample,
  getTorsoVelocity,
  pickCue,
  statusFromCues,
  LM,
  type Trimester,
  type TorsoMotionSample,
  type Variation,
} from "@/lib/pregnancyRules";
import { matchFaq } from "@/lib/faq";
import { playCueText, speakText, stopSpeaking, transcribeBlob } from "@/lib/voice";

export const Route = createFileRoute("/workout/$id")({
  head: () => ({ meta: [{ title: "Live workout · Juno" }] }),
  component: LiveWorkout,
});

const REPS_PER_SET = 10;
const TOTAL_SETS = 3;
const CUE_COOLDOWN = 7000;
const TARGET_DURATION = 20 * 60;

function LiveWorkout() {
  const navigate = useNavigate();
  const { recordSession } = useUserProfile();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const rulesRef = useRef<any>(null);
  const lastCueTime = useRef(0);
  const lastBreathTime = useRef(0);
  const lastImpactCueTime = useRef(0);
  const impactStreakRef = useRef(0);
  const prevMotionRef = useRef<TorsoMotionSample | null>(null);
  const prevKneeRef = useRef<number | null>(null);
  const repPhaseRef = useRef<"standing" | "down">("standing");
  const reachedDepthRef = useRef(false);
  const repsRef = useRef(0);
  const setsDoneRef = useRef(0);
  const frameCount = useRef(0);
  const qaActiveRef = useRef(false);
  const pausedRef = useRef(false);
  const drawUtilsRef = useRef<any>(null);
  const startedAtRef = useRef(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);

  // For simplicity in the integrated app we pick sensible defaults for the
  // medical rule set (2nd trimester, bodyweight). Could be wired to onboarding.
  const trimester: Trimester = 2;
  const variation: Variation = "bodyweight";

  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState(0);
  const [setNum, setSetNum] = useState(1);
  const [tracked, setTracked] = useState(false);
  const [activeCue, setActiveCue] = useState<string>("none");
  const [statusColor, setStatusColor] = useState<string>(STATUS_COLORS.good);
  const [kneeAngle, setKneeAngle] = useState<string>("--");
  const [hipAngle, setHipAngle] = useState<string>("--");
  const [impactWarning, setImpactWarning] = useState(false);
  const [loadingCam, setLoadingCam] = useState(false);
  const [paused, setPaused] = useState(false);

  const [qa, setQa] = useState({
    active: false,
    completedSet: 0,
    phase: "idle" as "idle" | "recording" | "transcribing" | "answering",
    transcript: "",
    answer: "",
    mode: "set" as "set" | "manual",
  });

  useEffect(() => {
    rulesRef.current = getRules(trimester, variation);
  }, []);

  // Tick session timer (frozen while paused)
  useEffect(() => {
    if (!started) return;
    const t = window.setInterval(() => {
      if (!pausedRef.current) setElapsed((e) => e + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [started]);

  const playCue = useCallback((key: string) => {
    const now = Date.now();
    if (now - lastCueTime.current < CUE_COOLDOWN) return false;
    lastCueTime.current = now;
    const text = PREGNANCY_PHRASES[key];
    if (text) playCueText(key, text);
    return true;
  }, []);

  // Pause analysis and open the voice Q&A.
  //   mode "set"    -> automatic break after a completed set
  //   mode "manual" -> user tapped "Ask a question" mid-workout
  const openQA = useCallback((mode: "set" | "manual" = "set") => {
    const completedSet =
      mode === "set" ? setsDoneRef.current + 1 : setsDoneRef.current;
    qaActiveRef.current = true;
    impactStreakRef.current = 0;
    prevMotionRef.current = null;
    setImpactWarning(false);
    if (mode === "set") setReps(REPS_PER_SET);
    setQa({ active: true, completedSet, phase: "idle", transcript: "", answer: "", mode });
    speakText(
      mode === "set"
        ? `Set ${completedSet} done, nice work! Any questions for me? ` +
            `Tap the microphone to ask, or continue when you're ready.`
        : "Ask me anything about your squat form, breathing, or workout. " +
            "Tap the microphone when you are ready."
    );
  }, []);

  const onResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const lm = results.poseLandmarks;
      if (!lm) {
        if (mountedRef.current) setTracked(false);
        return;
      }

      const isTracked = bodyVisible(lm);

      const draw = drawUtilsRef.current;
      const POSE_CONNECTIONS = draw?.POSE_CONNECTIONS;

      // Paused or in Q&A: keep drawing the skeleton, skip all analysis/coaching.
      if (qaActiveRef.current || pausedRef.current) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-w, 0);
        if (draw) {
          draw.drawConnectors(ctx, lm, POSE_CONNECTIONS, {
            color: STATUS_COLORS.good,
            lineWidth: 3,
          });
          draw.drawLandmarks(ctx, lm, {
            color: "#fff",
            fillColor: STATUS_COLORS.good,
            radius: 4,
          });
        }
        ctx.restore();
        return;
      }

      const rules = rulesRef.current;
      if (!rules) return;

      const nowImpact = Date.now();
      const metrics = getPoseMetrics(lm);
      const motionSample: TorsoMotionSample = {
        ...getTorsoMotionSample(lm),
        time: nowImpact,
      };
      const motionVelocity = getTorsoVelocity(motionSample, prevMotionRef.current);
      // Debounce: require two consecutive fast frames before flagging impact, so
      // a single jerky frame doesn't trip the warning.
      if (isTracked && motionVelocity >= IMPACT_VELOCITY_THRESHOLD) {
        impactStreakRef.current += 1;
      } else {
        impactStreakRef.current = 0;
      }
      const impactActive = isTracked && impactStreakRef.current >= 2;
      const impactWarningReady =
        impactActive &&
        nowImpact - lastImpactCueTime.current >= IMPACT_WARNING_COOLDOWN;

      // Form feedback drives the status color and rep tracking. High impact is
      // surfaced as an *additive* warning (banner + spoken cue) below.
      const cues = isTracked ? getFormCues(metrics, rules, prevKneeRef.current) : [];
      const statusKey = statusFromCues(cues);
      const color = STATUS_COLORS[statusKey];

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-w, 0);
      if (draw) {
        draw.drawConnectors(ctx, lm, POSE_CONNECTIONS, {
          color: isTracked ? color : "#888",
          lineWidth: 3,
        });
        draw.drawLandmarks(ctx, lm, {
          color: "#fff",
          fillColor: isTracked ? color : "#888",
          radius: 4,
        });
        draw.drawLandmarks(
          ctx,
          [lm[LM.LEFT_KNEE], lm[LM.RIGHT_KNEE]],
          { color, fillColor: color, radius: 8 }
        );
      }
      ctx.restore();

      if (!isTracked) {
        if (mountedRef.current) {
          setTracked(false);
          setImpactWarning(false);
        }
        prevMotionRef.current = null;
        impactStreakRef.current = 0;
        return;
      }

      const now = Date.now();

      const { avgKnee } = metrics;
      if (avgKnee > STANDING_ANGLE) {
        if (repPhaseRef.current === "down" && reachedDepthRef.current) {
          repsRef.current += 1;
          reachedDepthRef.current = false;
          if (repsRef.current >= REPS_PER_SET) {
            openQA("set");
          } else {
            setReps(repsRef.current);
          }
        }
        repPhaseRef.current = "standing";
      } else {
        repPhaseRef.current = "down";
        if (avgKnee >= rules.minKnee && avgKnee <= rules.maxKnee) {
          reachedDepthRef.current = true;
        }
      }

      const breathDue = now - lastBreathTime.current >= rules.breathInterval;
      const candidateCues = breathDue ? [...cues, "remember_to_breathe"] : cues;
      // Form cues take priority; high-impact only speaks when there's no form
      // cue, so it stays additive rather than overriding.
      const chosen = pickCue(candidateCues);
      if (impactActive && !chosen && impactWarningReady) {
        const fired = playCue("high_impact");
        if (fired) lastImpactCueTime.current = now;
      } else if (chosen) {
        const fired = playCue(chosen);
        if (fired && chosen === "remember_to_breathe") lastBreathTime.current = now;
      }

      prevMotionRef.current = motionSample;
      prevKneeRef.current = avgKnee;

      frameCount.current += 1;
      if (frameCount.current % 6 === 0 && mountedRef.current) {
        setTracked(true);
        setKneeAngle(avgKnee.toFixed(0));
        setHipAngle(metrics.hipAngle.toFixed(0));
        setActiveCue(
          chosen ?? (impactWarningReady ? "high_impact" : "none")
        );
        setStatusColor(color);
        setImpactWarning(impactActive);
      }
    },
    [playCue, openQA]
  );

  // Camera / pose lifecycle (only after user presses Begin)
  useEffect(() => {
    if (!started) return;
    mountedRef.current = true;
    setLoadingCam(true);

    repsRef.current = 0;
    setsDoneRef.current = 0;
    reachedDepthRef.current = false;
    repPhaseRef.current = "standing";
    prevKneeRef.current = null;
    prevMotionRef.current = null;
    impactStreakRef.current = 0;
    lastCueTime.current = 0;
    lastBreathTime.current = Date.now();
    lastImpactCueTime.current = 0;
    qaActiveRef.current = false;
    startedAtRef.current = Date.now();
    setReps(0);
    setSetNum(1);
    setImpactWarning(false);

    let cancelled = false;
    (async () => {
      const [{ Pose, POSE_CONNECTIONS }, { Camera }, drawing] = await Promise.all([
        import("@mediapipe/pose"),
        import("@mediapipe/camera_utils"),
        import("@mediapipe/drawing_utils"),
      ]);
      if (cancelled) return;
      drawUtilsRef.current = {
        drawConnectors: drawing.drawConnectors,
        drawLandmarks: drawing.drawLandmarks,
        POSE_CONNECTIONS,
      };

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onResults);
      poseRef.current = pose;

      if (!videoRef.current) return;
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && poseRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start().then(() => {
        if (mountedRef.current) setLoadingCam(false);
      });
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      try {
        cameraRef.current?.stop();
        poseRef.current?.close();
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        stopSpeaking();
      } catch (e) {
        console.warn("[cleanup]", e);
      }
    };
  }, [started, onResults]);

  const onRecordingStop = async () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    const type = mediaRecorderRef.current?.mimeType || "audio/webm";
    const blob = new Blob(audioChunksRef.current, { type });

    setQa((q) => ({ ...q, phase: "transcribing" }));
    const transcript = await transcribeBlob(blob);
    if (!transcript) {
      setQa((q) => ({
        ...q,
        phase: "idle",
        transcript: "",
        answer: "I didn't catch that — tap the mic and try again.",
      }));
      return;
    }
    const { answer } = matchFaq(transcript);
    setQa((q) => ({ ...q, phase: "answering", transcript, answer }));
    await speakText(answer);
    setQa((q) => ({ ...q, phase: "idle" }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };
      mr.onstop = onRecordingStop;
      mediaRecorderRef.current = mr;
      mr.start();
      setQa((q) => ({ ...q, phase: "recording", transcript: "", answer: "" }));
    } catch (e) {
      console.warn("[mic] error", e);
      setQa((q) => ({
        ...q,
        phase: "idle",
        answer: "I could not access the microphone — check your browser permissions.",
      }));
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
  };

  const continueFromQA = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = null;
      mr.stop();
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    stopSpeaking();

    const mode = qa.mode;
    prevMotionRef.current = null;
    impactStreakRef.current = 0;
    lastBreathTime.current = Date.now();
    lastImpactCueTime.current = 0;
    qaActiveRef.current = false;
    setQa({ active: false, completedSet: 0, phase: "idle", transcript: "", answer: "", mode: "set" });

    // Manual question: just resume the current set where it left off.
    if (mode === "manual") return;

    setsDoneRef.current += 1;
    repsRef.current = 0;
    reachedDepthRef.current = false;
    repPhaseRef.current = "standing";
    prevKneeRef.current = null;

    if (setsDoneRef.current >= TOTAL_SETS) {
      finishSession();
    } else {
      setReps(0);
      setSetNum(setsDoneRef.current + 1);
    }
  };

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) {
        stopSpeaking();
        setImpactWarning(false);
        impactStreakRef.current = 0;
        prevMotionRef.current = null;
      } else {
        // Resuming: don't let stale timing fire a burst of cues.
        lastBreathTime.current = Date.now();
        lastImpactCueTime.current = Date.now();
      }
      return next;
    });
  };

  const finishSession = () => {
    const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    const totalReps = setsDoneRef.current * REPS_PER_SET + repsRef.current;
    const formScore = Math.min(95, 70 + Math.floor(durationSec / 30));
    const session: LastSession = {
      name: "Pregnancy-Safe Squats",
      durationSec,
      reps: totalReps,
      setsCompleted: setsDoneRef.current,
      totalSets: TOTAL_SETS,
      formScore,
      feedback: {
        kneeAlignment: "good",
        backPosture: "great",
        depth: "good",
        coreEngagement: "needs",
      },
    };
    if (started && durationSec > 0) recordSession(session);
    navigate({ to: "/mood" });
  };

  const handleEnd = () => {
    finishSession();
  };

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  const sessionPct = Math.min(100, (elapsed / TARGET_DURATION) * 100);
  const setPct = (reps / REPS_PER_SET) * 100;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.85fr_1fr] lg:p-6">
        {/* CAMERA */}
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-3xl bg-[#1A1A1A] ring-1 ring-white/10">
            {/* corner brackets */}
            {[
              "top-3 left-3 border-l-2 border-t-2",
              "top-3 right-3 border-r-2 border-t-2",
              "bottom-3 left-3 border-l-2 border-b-2",
              "bottom-3 right-3 border-r-2 border-b-2",
            ].map((c) => (
              <span key={c} className={`absolute ${c} h-6 w-6 rounded-md border-primary-light/70 z-20 pointer-events-none`} />
            ))}

            <div className="absolute left-4 top-4 z-20 font-serif text-base lowercase text-white/60">juno</div>
            <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              Pregnancy-Safe Squat
            </div>

            {/* video + canvas (mirrored) */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
            />

            {/* Pre-start overlay */}
            {!started && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/60 px-6 text-center backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  <CameraIcon className="h-7 w-7 text-primary-light" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl">Motion Detection Zone</h2>
                  <p className="mt-1 max-w-xs text-xs text-white/60">
                    Place your camera 6–8 ft away, hip height. Stand so your whole body — head to feet — is in frame.
                  </p>
                </div>
                <button
                  onClick={() => setStarted(true)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-7 py-3 text-sm font-semibold text-white shadow-bloom-lg transition-transform hover:scale-105"
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Begin Workout
                </button>
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  MediaPipe pose tracking
                </p>
              </div>
            )}

            {started && loadingCam && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-sm text-white/70">
                Loading camera & model…
              </div>
            )}

            {started && !loadingCam && !tracked && !qa.active && !paused && (
              <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border border-warning/60 bg-warning/15 px-3 py-1.5 text-xs text-warning">
                Step back so your whole body fits in frame
              </div>
            )}

            {/* Active coaching cue banner */}
            {started && !qa.active && !paused && activeCue !== "none" && PREGNANCY_PHRASES[activeCue] && (
              <div
                className="absolute left-1/2 top-16 z-20 max-w-[85%] -translate-x-1/2 rounded-2xl border-2 bg-black/70 px-4 py-2 text-center text-sm font-semibold backdrop-blur"
                style={{ borderColor: statusColor, color: statusColor }}
              >
                {PREGNANCY_PHRASES[activeCue]}
              </div>
            )}

            {/* Additive high-impact warning */}
            {started && !qa.active && !paused && impactWarning && activeCue !== "high_impact" && (
              <div className="absolute left-1/2 top-28 z-20 max-w-[85%] -translate-x-1/2 rounded-2xl border-2 border-destructive bg-black/70 px-4 py-2 text-center text-xs font-semibold text-destructive backdrop-blur">
                {PREGNANCY_PHRASES.high_impact}
              </div>
            )}

            {/* Paused overlay */}
            {started && paused && !qa.active && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center backdrop-blur">
                <div className="font-serif text-2xl">Paused</div>
                <div className="text-sm text-white/70">
                  Take your time. Resume whenever you're ready.
                </div>
                <button
                  onClick={togglePause}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-7 py-3 text-sm font-semibold text-white shadow-bloom-lg transition-transform hover:scale-105"
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Resume
                </button>
              </div>
            )}

            {/* Q&A overlay (between-sets + manual "ask a question") */}
            {qa.active && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center backdrop-blur">
                <div className="font-serif text-2xl">
                  {qa.mode === "set" ? `Set ${qa.completedSet} done! 🎉` : "Ask a question 💬"}
                </div>
                <div className="text-sm text-white/70">
                  {qa.mode === "set"
                    ? "Any questions? Tap the mic to ask — or continue."
                    : "Tap the mic to ask about your form, breathing, or setup."}
                </div>
                <button
                  onClick={qa.phase === "recording" ? stopRecording : startRecording}
                  disabled={qa.phase === "transcribing" || qa.phase === "answering"}
                  className={`flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold shadow-bloom transition-transform hover:scale-105 disabled:opacity-60 ${
                    qa.phase === "recording"
                      ? "bg-destructive text-white"
                      : "bg-gradient-to-r from-primary to-primary-light text-white"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  {qa.phase === "recording"
                    ? "Stop & send"
                    : qa.phase === "transcribing"
                    ? "Transcribing…"
                    : qa.phase === "answering"
                    ? "Answering…"
                    : "Tap to ask"}
                </button>
                {qa.transcript && (
                  <div className="max-w-[80%] text-sm italic text-primary-light">
                    "{qa.transcript}"
                  </div>
                )}
                {qa.answer && (
                  <div className="max-w-[85%] rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-sm leading-relaxed text-white">
                    {qa.answer}
                  </div>
                )}
                <button
                  onClick={continueFromQA}
                  className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold hover:bg-white/20"
                >
                  {qa.mode === "manual"
                    ? "Back to workout"
                    : qa.completedSet >= TOTAL_SETS
                    ? "Finish session"
                    : "Continue to next set →"}
                </button>
              </div>
            )}

            {/* Bottom HUD */}
            <div className="absolute bottom-0 left-0 right-0 z-20 space-y-2 bg-gradient-to-t from-black/70 to-transparent p-4">
              {started && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/70">
                    <span>
                      Set {setNum} · {reps}/{REPS_PER_SET} reps
                    </span>
                    <span>{Math.round(setPct)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all"
                      style={{ width: `${setPct}%` }}
                    />
                  </div>
                  <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-white/40 transition-all"
                      style={{ width: `${sessionPct}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <Stat v={String(reps)} l="REPS" />
                <Stat v={`${setNum}/${TOTAL_SETS}`} l="SET" />
                <Stat v={`${mm}:${ss}`} l="⏱ TIME" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 text-foreground">
          <FormReference cue={activeCue} color={statusColor} variation={variation} />

          <div className="card-bloom p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Live Feedback</h3>
              <Volume2 className="h-4 w-4 text-primary" />
            </div>
            {!started ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-xs text-muted-foreground">
                Feedback will appear once you start moving.
              </div>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: statusColor }}
                  />
                  <span className="text-foreground">
                    {activeCue !== "none" && PREGNANCY_PHRASES[activeCue]
                      ? PREGNANCY_PHRASES[activeCue]
                      : tracked
                      ? "Looking great — keep going."
                      : "Reading your form…"}
                  </span>
                </li>
                <li className="text-xs text-muted-foreground">
                  Knee <span className="font-mono" style={{ color: statusColor }}>{kneeAngle}°</span> · Hip{" "}
                  <span className="font-mono text-success">{hipAngle}°</span>
                </li>
              </ul>
            )}
            <p className="mt-4 text-xs italic text-primary">
              "Listening to your body is the best guide."
            </p>
          </div>

          <div className="card-bloom p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">AI Coach</h3>
            </div>
            <div className="relative mt-3 rounded-2xl bg-primary-tint p-4 text-sm text-primary-dark">
              {started
                ? "Voice cues are powered by ElevenLabs. Tap below to ask me anything any time — no need to wait for a set break."
                : "Press Begin when you're ready — I'll guide you through every rep with spoken cues."}
            </div>
            {started && (
              <button
                onClick={() => openQA("manual")}
                disabled={qa.active || paused}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-4 py-2.5 text-sm font-semibold text-white shadow-bloom transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mic className="h-4 w-4" /> Ask a question
              </button>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3 w-3" /> ElevenLabs Voice Coach
            </div>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-6 lg:px-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#1A1A1A] px-5 py-4 ring-1 ring-white/5">
          <p className="flex-1 text-xs italic text-white/60">
            Stop if you feel pain, dizziness, bleeding, contractions, or anything unusual. Always follow your clinician's advice.
          </p>
          {started && (
            <button
              onClick={togglePause}
              disabled={qa.active}
              className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paused ? (
                <>
                  <Play className="h-4 w-4" fill="currentColor" /> Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              )}
            </button>
          )}
          <button
            onClick={handleEnd}
            className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <X className="h-4 w-4" /> End Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur">
      <div className="text-lg font-bold">{v}</div>
      <div className="text-[10px] text-white/60">{l}</div>
    </div>
  );
}

function FormReference({
  cue,
  color,
  variation,
}: {
  cue: string;
  color: string;
  variation: Variation;
}) {
  const { gif, tip } = formReferenceFor(cue, variation);
  const correcting = cue && cue !== "none" && cue !== "good_form";
  return (
    <div className="card-bloom p-5">
      <h3 className="font-semibold">Correct Form</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {correcting
          ? "Mirror this to fix your form"
          : "Match this demonstration as you move"}
      </p>
      <div
        className="relative mt-3 overflow-hidden rounded-2xl border-2 bg-primary-tint"
        style={{ borderColor: color }}
      >
        <img
          src={gif.url}
          alt={gif.label}
          loading="lazy"
          className="block w-full aspect-square object-cover"
        />
        <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          {gif.label}
        </div>
      </div>
      <div
        className="mt-3 rounded-xl bg-primary-tint p-3 text-xs text-primary-dark"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        {tip}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Demonstrations via Healthline
      </p>
    </div>
  );
}
