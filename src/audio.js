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
}

// Play a cue by key. No-op-safe for unknown keys.
export function playAudio(cueKey) {
  const text = cache.get(cueKey) ?? PREGNANCY_PHRASES[cueKey]
  if (!text) {
    console.warn('[playAudio] unknown cue', cueKey)
    return
  }
  // TODO(elevenlabs): cache.get(cueKey).play()
  console.log('[playAudio]', cueKey, '→', text)
}
