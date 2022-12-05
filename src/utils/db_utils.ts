import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore/lite";
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKQBYKydJtEz6fo_gWaKaDfHYP3SCu_RM",
  authDomain: "fir-rtc-ce975.firebaseapp.com",
  projectId: "fir-rtc-ce975",
  storageBucket: "fir-rtc-ce975.appspot.com",
  messagingSenderId: "699244501679",
  appId: "1:699244501679:web:f8e3a1c857a281c5a1125a",
  measurementId: "G-6FJYP74M6B",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get a list of cities from your database
export async function getCities() {
  const citiesCol = collection(db, "cities");
  const citySnapshot = await getDocs(citiesCol);
  const cityList = citySnapshot.docs.map((doc) => doc.data());
  return cityList;
}
