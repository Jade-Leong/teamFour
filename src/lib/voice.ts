// Client-side helpers for ElevenLabs TTS / STT via our server routes.

const cueLastPlayed = new Map<string, number>();
const PER_CUE_COOLDOWN = 8000;
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
  cueLastPlayed.set(cueKey, now);
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
