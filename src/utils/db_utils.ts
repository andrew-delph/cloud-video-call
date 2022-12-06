import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/auth";

// TODO: Use a configuration object
firebase.initializeApp({
  projectId: "",
  appId: "",
  databaseURL: "",
  storageBucket: "",
  locationId: "",
  apiKey: "",
  authDomain: "",
  messagingSenderId: "",
});

const db = firebase.firestore();
// const auth = firebase.auth;

// eslint-disable-next-line no-restricted-globals
if (location.hostname === "localhost") {
  console.log("using localhost");
  db.useEmulator("localhost", 8080);
  // auth().useEmulator("http://localhost:9099/");
}

db.doc("hello/world").set({ test1: "test2" });

db.doc("hello/world")
  .get()
  .then((data) => {
    console.log("get data", data.data());
  });

export default firebase;
// export { db, auth };
export { db };
