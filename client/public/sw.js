// Minimal service worker: enough for installability, deliberately no caching.
// The app talks to a live LLM backend, so stale-shell bugs would cost more
// than offline support is worth on this project.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
