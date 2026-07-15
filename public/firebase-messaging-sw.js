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

try {
  firebase.initializeApp(firebaseConfig);
  // Retrieve an instance of Firebase Messaging so that it can handle background messages.
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // Extract title and body from either notification or data payload
    const notificationTitle = payload?.notification?.title || payload?.data?.title || 'New Notification';
    const notificationOptions = {
      body: payload?.notification?.body || payload?.data?.body || 'You have a new message',
      icon: '/AmbigaaSilks_logo.png', // Assuming this is the correct icon path based on backend
      badge: '/AmbigaaSilks_logo.png',
      data: payload?.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase SW config error: ', e);
}

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
