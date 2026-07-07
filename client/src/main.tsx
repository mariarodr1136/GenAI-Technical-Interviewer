import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import LandingPage from "./LandingPage.tsx";
import "./styles/index.css";

function Root() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) return <App onHome={() => setShowApp(false)} />;
  return <LandingPage onEnter={() => setShowApp(true)} />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// PWA installability. Registered in production only so the dev server never
// fights a service worker.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
