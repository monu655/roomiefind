import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCQW1pxEZyKhWmGuCwpI57RbH_vL1jl-bI",
  authDomain: "roomiefind-64256.firebaseapp.com",
  databaseURL: "https://roomiefind-64256-default-rtdb.firebaseio.com",
  projectId: "roomiefind-64256",
  storageBucket: "roomiefind-64256.firebasestorage.app",
  messagingSenderId: "724625659186",
  appId: "1:724625659186:web:5ded53e7cd4ca98eeb332b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);