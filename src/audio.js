// =============================================================================
// audio.js
//
// Audio cue layer. ElevenLabs TTS is stubbed for now — everything is a
// console.log placeholder. The shape (pre-cache at session start, then play by
// key) is what the real ElevenLabs wiring will plug into:
//
//   precacheAudio() -> fetch + decode TTS for every phrase once, store blobs
//   playAudio(key)  -> play the cached blob for `key`
// =============================================================================

import { PREGNANCY_PHRASES } from './pregnancyRules'

// key -> cached audio (today: the phrase string; later: an HTMLAudioElement/Blob)
const cache = new Map()

// Pre-cache every phrase at the start of a session so playback is instant and
// we never block the coaching loop on a network round-trip.
export function precacheAudio() {
  cache.clear()
  for (const [key, text] of Object.entries(PREGNANCY_PHRASES)) {
    // TODO(elevenlabs): const blob = await fetchTTS(text); cache.set(key, new Audio(URL.createObjectURL(blob)))
    cache.set(key, text)
    console.log('[precacheAudio] cached', key, '→', text)
  }
  console.log(`[precacheAudio] ${cache.size} phrases ready`)

  //testing
  playAudio('good_form')
}

// Play a cue by key. No-op-safe for unknown keys.
export async function playAudio(cueKey) {
  const text = cache.get(cueKey) ?? PREGNANCY_PHRASES[cueKey]
  if (!text) {
    console.warn('[playAudio] unknown cue', cueKey)
    return
  }
  // TODO(elevenlabs): cache.get(cueKey).play()
 const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID
const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY

fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_flash_v2_5',
    }),
  }
)
  .then((res) => res.blob())
  .then((blob) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.play()
  })
}
