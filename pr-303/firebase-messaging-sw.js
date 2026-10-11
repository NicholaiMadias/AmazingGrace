importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDbc-imBd_m9CQ-39kbmLbNeY5Itw4nZXI",
  authDomain: "amazing-grace-hl.firebaseapp.com",
  projectId: "amazing-grace-hl",
  storageBucket: "amazing-grace-hl.firebasestorage.app",
  messagingSenderId: "1081883726845",
  appId: "1:1081883726845:web:88b49fc41d949e5511ff94",
  measurementId: "G-WLYVDX4GWR"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
