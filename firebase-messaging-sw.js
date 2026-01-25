importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyBl5qUBgdizyFhZsDDQOXM_JlFHtn7PZj0",
  authDomain: "dojo-du-moine-guerrier.firebaseapp.com",
  projectId: "dojo-du-moine-guerrier",
  storageBucket: "dojo-du-moine-guerrier.firebasestorage.app",
  messagingSenderId: "395565857197",
  appId: "1:395565857197:web:dedd212901fcd4835e8924",
  measurementId: "G-WYNDY2KDP5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "icon-192.png"
    });
});
