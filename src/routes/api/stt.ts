import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
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
          headers: { "xi-api-key": apiKey },
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
