importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAlKBYVElHzwv9bnZGvx0ZosAnkCzwKb8Y",
  authDomain: "agssmt-b2b-wholesale.firebaseapp.com",
  projectId: "agssmt-b2b-wholesale",
  storageBucket: "agssmt-b2b-wholesale.firebasestorage.app",
  messagingSenderId: "379585739695",
  appId: "1:379585739695:web:ef8d277a741b73d5f04d5a",
  measurementId: "G-ZFM70NTRX2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new message.',
    icon: '/AmbigaaSilks_logo.png',
    badge: '/AmbigaaSilks_logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
