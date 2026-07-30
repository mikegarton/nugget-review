// Minimal service worker — exists to make the site installable as a PWA so
// the share_target in manifest.webmanifest appears in Android's share sheet.
// No caching: every request goes to the network (a stale control room or a
// stale share handler would be worse than a moment of load time).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* default network handling */ });
