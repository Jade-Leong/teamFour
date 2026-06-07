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
  synthesizeSpeech,
  speakWithElevenLabs,
  elevenLabsConfigured,
} from './services/elevenlabs'

// key -> HTMLAudioElement
const cache = new Map()

// Pre-cache every phrase at the start of a session. Syntheses run in parallel
// and populate the cache as they resolve; a failed phrase just falls back to
// on-demand synthesis (or a log) the first time it's needed.
export async function precacheAudio() {
  cache.clear()

  if (!elevenLabsConfigured()) {
    console.warn(
      '[precacheAudio] ElevenLabs not configured — set VITE_ELEVENLABS_API_KEY ' +
        'and VITE_ELEVENLABS_VOICE_ID in .env. Cues will log only.'
    )
    return
  }

  const entries = Object.entries(PREGNANCY_PHRASES)
  await Promise.all(
    entries.map(async ([key, text]) => {
      try {
        cache.set(key, await synthesizeSpeech(text))
        console.log('[precacheAudio] cached', key)
      } catch (e) {
        console.warn('[precacheAudio] failed', key, '—', e.message)
      }
    })
  )
  console.log(`[precacheAudio] ${cache.size}/${entries.length} cues ready`)
}

// Play a cue by key. No-op-safe for unknown keys.
export function playAudio(cueKey) {
  const text = PREGNANCY_PHRASES[cueKey]
  if (!text) {
    console.warn('[playAudio] unknown cue', cueKey)
    return
  }

  // Fast path: cached clip from session start.
  const cached = cache.get(cueKey)
  if (cached) {
    cached.currentTime = 0
    cached.play().catch((e) => console.warn('[playAudio] blocked', cueKey, '—', e.message))
    return
  }

  // No credentials → placeholder log so the flow still works for demos.
  if (!elevenLabsConfigured()) {
    console.log('[playAudio]', cueKey, '→', text)
    return
  }

  // Configured but not yet cached (e.g. cue fired before precache finished):
  // synthesize + play on demand.
  speakWithElevenLabs(text).catch((e) =>
    console.warn('[playAudio] on-demand failed', cueKey, '—', e.message)
  )
}
