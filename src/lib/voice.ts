// Client-side helpers for ElevenLabs TTS / STT via our server routes.

const cueLastPlayed = new Map<string, number>();
// arbitrary text -> last time it was spoken (Q&A / FAQ answers)
const lastSpokenByText = new Map<string, number>();
// Wall-clock time the last audio (cue or text) was sent to TTS — used to
// serialize speech so clips don't overlap and talk over each other.
let lastSpeakAt = 0;
const PER_CUE_COOLDOWN = 7000;
// Minimum gap between repeating the same text, and a global gap between clips.
const TTS_COOLDOWN = 7000;
const SPEAK_GAP = 2500;
let currentAudio: HTMLAudioElement | null = null;

async function fetchTTS(text: string): Promise<HTMLAudioElement | null> {
  try {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) {
      console.warn("[tts] failed", r.status);
      return null;
    }
    const blob = await r.blob();
    return new Audio(URL.createObjectURL(blob));
  } catch (e) {
    console.warn("[tts] error", e);
    return null;
  }
}

export function playCueText(cueKey: string, text: string) {
  const now = Date.now();
  const last = cueLastPlayed.get(cueKey) ?? 0;
  if (now - last < PER_CUE_COOLDOWN) return;
  // Global gap so a new cue never starts on top of speech still playing.
  if (now - lastSpeakAt < SPEAK_GAP) return;
  cueLastPlayed.set(cueKey, now);
  lastSpeakAt = now;
  fetchTTS(text).then((a) => {
    if (!a) return;
    try {
      currentAudio?.pause();
    } catch {}
    currentAudio = a;
    a.play().catch(() => {});
  });
}

export async function speakText(text: string): Promise<void> {
  if (!text) return;
  // Skip if we just spoke this exact text, so prompts/answers don't repeat or
  // stack on top of each other.
  const now = Date.now();
  const lastSpoken = lastSpokenByText.get(text) ?? 0;
  if (now - lastSpoken < TTS_COOLDOWN) return;
  lastSpokenByText.set(text, now);
  lastSpeakAt = now;
  const a = await fetchTTS(text);
  if (!a) return;
  try {
    currentAudio?.pause();
  } catch {}
  currentAudio = a;
  await new Promise<void>((resolve) => {
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}

export function stopSpeaking() {
  try {
    currentAudio?.pause();
  } catch {}
  currentAudio = null;
}

export async function transcribeBlob(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "question.webm");
  try {
    const r = await fetch("/api/stt", { method: "POST", body: form });
    if (!r.ok) return "";
    const data = (await r.json()) as { text?: string };
    return data.text || "";
  } catch {
    return "";
  }
}
