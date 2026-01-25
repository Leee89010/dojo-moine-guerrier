self.addEventListener("install", e => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    console.log("Service worker actif");
});

self.addEventListener("fetch", e => {
    e.respondWith(fetch(e.request));
});
messaging.onBackgroundMessage(payload => {
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "icon-192.png"
    });
});
