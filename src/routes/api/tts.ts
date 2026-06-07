import { createFileRoute } from "@tanstack/react-router";

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah - warm, friendly

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response("ElevenLabs not configured", { status: 500 });
        }
        const { text } = (await request.json()) as { text?: string };
        if (!text) return new Response("Missing text", { status: 400 });

        const r = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
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
