import { createFileRoute } from "@tanstack/react-router";

// Same config + call style as the squat-coach STT backend
// (src/services/elevenlabs.js → transcribeSpeech): ElevenLabs Scribe v1,
// reading the key from the project's existing .env (VITE_ name, with a
// server-style fallback).
const ELEVENLABS_API_KEY =
  process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!ELEVENLABS_API_KEY) {
          return new Response(JSON.stringify({ text: "" }), { status: 500 });
        }
        const incoming = await request.formData();
        const file = incoming.get("file");
        if (!file) {
          return new Response(JSON.stringify({ text: "" }), { status: 400 });
        }
        const form = new FormData();
        form.append("model_id", "scribe_v1");
        form.append("file", file as Blob, "question.webm");

        const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
          body: form,
        });
        if (!r.ok) {
          return new Response(JSON.stringify({ text: "" }), { status: r.status });
        }
        const data = (await r.json()) as { text?: string };
        return Response.json({ text: (data.text || "").trim() });
      },
    },
  },
});
