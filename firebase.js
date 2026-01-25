// --- CONFIG FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBl5qUBgdizyFhZsDDQOXM_JlFHtn7PZj0",
    authDomain: "dojo-du-moine-guerrier.firebaseapp.com",
    projectId: "dojo-du-moine-guerrier",
    storageBucket: "dojo-du-moine-guerrier.firebasestorage.app",
    messagingSenderId: "395565857197",
    appId: "1:395565857197:web:dedd212901fcd4835e8924",
    measurementId: "G-WYNDY2KDP5"
};

// --- INITIALISATION ---
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- CLÉ VAPID ---
const vapidKey = "BDcCdEu-qubVPVMvyJpaXSupQCHfAryaOoihi6Xqi84O4rkOmyYq4gICs9ZLTHB3IgfaXO0c96MoumqmQHCw_n4";

// --- DEMANDE DE PERMISSION ---
async function requestDojoNotifications() {
    console.log("🟡 Demande de permission…");

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.log("❌ Permission refusée");
        alert("Tu dois autoriser les notifications pour recevoir les messages du Dojo.");
        return;
    }

    console.log("✅ Permission accordée");

    try {
        const token = await messaging.getToken({ vapidKey });

        if (!token) {
            console.log("❌ Aucun token généré");
            alert("Impossible de générer un token. Réessaie.");
            return;
        }

        console.log("🔥 Token FCM :", token);
        localStorage.setItem("fcmToken", token);
        alert("Notifications activées !");

    } catch (err) {
        console.error("Erreur lors de la génération du token :", err);
    }
}

// --- RÉCEPTION DES NOTIFICATIONS EN PREMIER PLAN ---
messaging.onMessage(payload => {
    console.log("📩 Notification reçue :", payload);

    new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "icon-192.png"
    });
});

// --- BOUTON D’ACTIVATION (si présent sur la page) ---
const notifBtn = document.getElementById("enable-notifs");
if (notifBtn) {
    notifBtn.addEventListener("click", requestDojoNotifications);
}

// --- SERVICE WORKER ---
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
        .then(() => console.log("SW Firebase OK"))
        .catch(err => console.error("SW Firebase ERROR", err));
}
