import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUdnxx-sVbBOD2_7f1QJdbSBJWxFtu1TU",
  authDomain: "stockscan-app-75970.firebaseapp.com",
  databaseURL: "https://stockscan-app-75970-default-rtdb.firebaseio.com",
  projectId: "stockscan-app-75970",
  storageBucket: "stockscan-app-75970.firebasestorage.app",
  messagingSenderId: "1085129866342",
  appId: "1:1085129866342:web:25858e5e255d1b60c2c1a7",
  measurementId: "G-D0Y7DX6H10",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
