// =============================================================================
// audio.js
//
// Audio cue layer, wired to ElevenLabs TTS (src/services/elevenlabs.js).
//
//   precacheAudio() -> synthesize every phrase once at session start, cache the
//                      resulting <audio> elements so playback is instant.
//   playAudio(key)  -> play the cached clip for `key` (or fetch on demand on a
//                      cache miss). Falls back to a console.log placeholder when
//                      ElevenLabs isn't configured, so the app still works for
//                      demos without API credentials.
// =============================================================================
import { PREGNANCY_PHRASES } from './pregnancyRules'
import {
  speakWithElevenLabs,
  elevenLabsConfigured,
} from './services/elevenlabs'

// key -> HTMLAudioElement or audio URL
const cache = new Map()

// cueKey -> last time it played
const lastPlayedByCue = new Map()

// Prevent the same cue from firing over and over
const PER_CUE_COOLDOWN = 8000

export async function precacheAudio() {
  cache.clear()

  if (!elevenLabsConfigured()) {
    console.warn('[precacheAudio] ElevenLabs not configured — cues will log only.')
    return
  }

  // Hackathon-safe: do NOT pre-generate every cue.
  console.log('[precacheAudio] skipped bulk TTS generation')
}

export function playAudio(cueKey) {
  const text = PREGNANCY_PHRASES[cueKey]

  if (!text) {
    console.warn('[playAudio] unknown cue', cueKey)
    return
  }

  const now = Date.now()
  const lastPlayed = lastPlayedByCue.get(cueKey) ?? 0

  if (now - lastPlayed < PER_CUE_COOLDOWN) {
    return
  }

  lastPlayedByCue.set(cueKey, now)

  if (!elevenLabsConfigured()) {
    console.log('[playAudio]', cueKey, '→', text)
    return
  }

  speakWithElevenLabs(text).catch((e) =>
    console.warn('[playAudio] on-demand failed', cueKey, '—', e.message)
  )
}