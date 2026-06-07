// ElevenLabs text-to-speech for spoken coaching cues.
// Config comes from Vite env vars (.env): VITE_ELEVENLABS_API_KEY + VITE_ELEVENLABS_VOICE_ID.

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

// True only when both the API key and voice id are present, so callers can
// gracefully fall back (e.g. log-only) when running without credentials.
export function elevenLabsConfigured() {
  return Boolean(API_KEY && VOICE_ID);
}

// Fetch TTS audio for `text` and return a ready-to-play HTMLAudioElement
// WITHOUT playing it — used to pre-cache every cue at session start so
// playback during the squat loop is instant.
export async function synthesizeSpeech(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed (${response.status})`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  return new Audio(audioUrl);
}

// Fetch + play immediately (on-demand fallback for a cache miss).
export async function speakWithElevenLabs(text) {
  const audio = await synthesizeSpeech(text);
  await audio.play();
}

// STT only needs the API key (no voice), so it can run even if no voice is set.
export function sttConfigured() {
  return Boolean(API_KEY);
}

// Transcribe a recorded audio blob via ElevenLabs Speech-to-Text (Scribe).
// Returns the transcript string, or '' on any failure.
export async function transcribeSpeech(blob) {
  if (!API_KEY) {
    console.warn("[transcribeSpeech] no API key");
    return "";
  }

  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", blob, "question.webm");

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": API_KEY }, // let the browser set the multipart boundary
      body: form,
    });
    if (!response.ok) {
      console.error("[transcribeSpeech] STT failed", response.status, await response.text());
      return "";
    }
    const data = await response.json();
    return (data.text || "").trim();
  } catch (e) {
    console.error("[transcribeSpeech] error", e);
    return "";
  }
}
