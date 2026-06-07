# 1. Go into the export folder
cd export

# 2. Install dependencies (client + server)
npm install

# 3. Set up your API key
cp server/.env.example server/.env
# then open server/.env in any editor and paste your ElevenLabs key:
# ELEVENLABS_API_KEY=sk_your_key_here

# 4. Start the app (frontend + backend together)
npm run dev

Then open http://localhost:5173 in your browser.
