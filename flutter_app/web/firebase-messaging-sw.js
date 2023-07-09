importScripts(`https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js`);
importScripts(
  `https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js`,
);

firebase.initializeApp({
  apiKey: `AIzaSyDYpgOSidu-ug4SJ3I6ktocbBQhA91DDR0`,
  appId: `1:619217777312:web:2ef7fa42fd9bd1bed0cfc5`,
  messagingSenderId: `619217777312`,
  projectId: `react-video-call-thing72`,
  authDomain: `react-video-call-thing72.firebaseapp.com`,
  storageBucket: `react-video-call-thing72.appspot.com`,
});
const messaging = firebase.messaging();

// Optional:
messaging.onBackgroundMessage((message) => {
  console.log(`onBackgroundMessage`, message);
});
