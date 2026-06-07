import { createFileRoute } from "@tanstack/react-router";

// Config matches the squat-coach ElevenLabs backend (src/services/elevenlabs.js):
// read the key + voice from the same .env this project already uses. Accept the
// VITE_-prefixed names (what .env actually defines) and fall back to the plain
// server-style names so it works either way.
const ELEVENLABS_API_KEY =
  process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ||
  process.env.VITE_ELEVENLABS_VOICE_ID ||
  "gmv0PPPs8m6FEf03PImj";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!ELEVENLABS_API_KEY) {
          return new Response("ElevenLabs not configured", { status: 500 });
        }
        const { text } = (await request.json()) as { text?: string };
        if (!text) return new Response("Missing text", { status: 400 });

        const r = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
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
        if (!r.ok) {
          return new Response(await r.text(), { status: r.status });
        }
        const buf = await r.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    },
  },
});
