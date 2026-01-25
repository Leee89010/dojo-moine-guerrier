self.addEventListener("install", e => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    console.log("Service worker actif");
});

self.addEventListener("fetch", e => {
    e.respondWith(fetch(e.request));
});
