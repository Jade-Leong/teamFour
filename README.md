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
   persistent **STOP** button. Target: 3 sets of 10–15 reps with a 30s rest
   break after each set.

## Coaching logic

- **Trimester thresholds** (`TRIMESTER_RULES`) set the depth window, stance
  width, and breath-reminder cadence; **variation rules** (`VARIATION_RULES`)
  override them (shallow merge, variation wins).
- **Form rules**: knees-over-toes (most important), back-straight, stance
  width, knee cave (stricter 10° due to relaxin joint laxity), depth (only
  ever flags *too deep* — never pushes lower), relaxed forward-lean, timed
  breath reminders, and an ascending-phase glute cue.
- **Audio** cues are spoken one at a time by priority with a 3s cooldown.
  ElevenLabs TTS is stubbed (`src/audio.js`) as `console.log` placeholders for
  now; phrases are "pre-cached" at session start.

## Files

- `src/pregnancyRules.js` — rule tables, phrases, stop signs, and pure
  pose-analysis helpers.
- `src/audio.js` — audio cue layer (ElevenLabs placeholder).
- `src/App.jsx` — flow, screens, MediaPipe wiring, rep counting, and overlay.


Using ElevenLabs to get the `cue` from MediaPipe

go deeper
knees caving chest up 