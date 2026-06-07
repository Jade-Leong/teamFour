# Pregnancy Squat Coach

A gentle, camera-based prenatal squat form coach built on MediaPipe Pose
(React + Vite). Form guidance is grounded in ACOG ("Exercise During
Pregnancy") and Healthline's medically-reviewed prenatal-squat articles.

> ⚠️ Not medical advice. General form feedback only — always get your
> healthcare provider's clearance to exercise during pregnancy.

## Run

```bash
npm install
npm run dev
```

Open the printed URL and allow camera access.

## Flow

1. **Medical disclaimer** — acknowledge the stop-signs list before continuing.
2. **Setup** — pick your trimester (1st / 2nd / 3rd) and a squat variation
   (Bodyweight / Sumo / Chair-supported).
3. **Positioning** — instructions for standing so the camera tracks you well.
4. **Coaching** — live skeleton overlay, spoken cues, rep + set counter, and a
   persistent **STOP** button. Across 3 sets of 10 reps; stop any time.
5. **Between-sets Q&A** — after each set (10/20/30 reps) the coach pauses and
   asks "any questions?". Push-to-talk: tap the mic, speak, and your question is
   transcribed (ElevenLabs speech-to-text), matched to a curated, medically-
   grounded squat FAQ (`src/faq.js`), and the answer is spoken back (TTS). Tap
   *continue* to resume the next set. Off-topic questions get a safe
   "ask your provider" fallback — it never improvises medical advice.

## Coaching logic

- **Trimester thresholds** (`TRIMESTER_RULES`) set the depth window, stance
  width, and breath-reminder cadence; **variation rules** (`VARIATION_RULES`)
  override them (shallow merge, variation wins).
- **Form rules**: knees-over-toes (most important), back-straight, stance
  width, knee cave (stricter 10° due to relaxin joint laxity), depth (only
  ever flags *too deep* — never pushes lower), relaxed forward-lean, timed
  breath reminders, and an ascending-phase glute cue.
- **Audio** cues are spoken one at a time by priority with a 3s cooldown,
  voiced by ElevenLabs TTS. All phrases are pre-synthesized at session start so
  playback during the squat loop is instant; a cache miss synthesizes on demand.

## ElevenLabs setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
VITE_ELEVENLABS_API_KEY=...
VITE_ELEVENLABS_VOICE_ID=...
```

Then restart `npm run dev`. Without these, the app still runs fully and logs
cues to the console instead of speaking them.

## Files

- `src/pregnancyRules.js` — rule tables, phrases, stop signs, and pure
  pose-analysis helpers.
- `src/services/elevenlabs.js` — ElevenLabs calls: TTS (synthesize + play) and
  speech-to-text (`transcribeSpeech`).
- `src/audio.js` — cue layer: plays cues + `speakText` for arbitrary phrases,
  with graceful fallback when ElevenLabs isn't configured.
- `src/faq.js` — curated pregnancy-squat FAQ + keyword matcher for the Q&A.
- `src/App.jsx` — flow, screens, MediaPipe wiring, rep counting, overlay, and
  the between-sets voice Q&A.