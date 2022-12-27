import { initializeApp } from "firebase/app";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { store } from "./utils/store";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYpgOSidu-ug4SJ3I6ktocbBQhA91DDR0",
  authDomain: "react-video-call-thing72.firebaseapp.com",
  projectId: "react-video-call-thing72",
  storageBucket: "react-video-call-thing72.appspot.com",
  messagingSenderId: "619217777312",
  appId: "1:619217777312:web:2ef7fa42fd9bd1bed0cfc5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("app", app);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
