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
  
  // Note: We do not need a custom onBackgroundMessage here because the backend sends 
  // the `notification` payload (title/body). Firebase automatically intercepts this 
  // and displays a system notification when the app is in the background or closed!
} catch (e) {
  console.log('Firebase SW config error: ', e);
}
