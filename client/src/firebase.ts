import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

firebase.initializeApp({
  projectId: "react-video-call-thing72",
  appId: "1:619217777312:web:2ef7fa42fd9bd1bed0cfc5",
  storageBucket: "react-video-call-thing72.appspot.com",
  locationId: "us-central",
  apiKey: "AIzaSyDYpgOSidu-ug4SJ3I6ktocbBQhA91DDR0",
  authDomain: "react-video-call-thing72.firebaseapp.com",
  messagingSenderId: "619217777312",
});

const db = firebase.firestore();

// eslint-disable-next-line no-restricted-globals
if (location.hostname === "localhost") {
  db.useEmulator("localhost", 8080);
}

export default firebase;
export { db };
