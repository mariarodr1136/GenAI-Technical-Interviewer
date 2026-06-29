import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import LandingPage from "./LandingPage.jsx";
import "./styles.css";

function Root() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) return <App onHome={() => setShowApp(false)} />;
  return <LandingPage onEnter={() => setShowApp(true)} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
