import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

cd export
npm install
cp server/.env.example server/.env   # add ELEVENLABS_API_KEY
npm run dev

# client → http://localhost:5173, server → http://localhost:3001 (proxied at /api)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
