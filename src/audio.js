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

const cache = new Map()

async function fetchTTS(text) {
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY

  if (!voiceId || !apiKey) {
    console.warn('[ElevenLabs] Missing API key or voice ID')
    return null
  }

  const response = await fetch(
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
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok) {
    console.error('[ElevenLabs] TTS failed', await response.text())
    return null
  }

  return await response.blob()
}

export async function precacheAudio() {
  cache.clear()

  for (const [key, text] of Object.entries(PREGNANCY_PHRASES)) {
    const blob = await fetchTTS(text)

    if (!blob) continue

    const url = URL.createObjectURL(blob)
    cache.set(key, url)

    console.log('[precacheAudio] cached', key)
  }

  console.log(`[precacheAudio] ${cache.size} phrases ready`)
}

export async function playAudio(cueKey) {
  const text = PREGNANCY_PHRASES[cueKey]

  if (!text) {
    console.warn('[playAudio] unknown cue', cueKey)
    return
  }

  let url = cache.get(cueKey)

  if (!url) {
    const blob = await fetchTTS(text)

    if (!blob) return

    url = URL.createObjectURL(blob)
    cache.set(cueKey, url)
  }

  const audio = new Audio(url)
  await audio.play()
}