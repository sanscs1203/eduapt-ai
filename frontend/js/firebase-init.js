import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLvJ3Bc05N9jQDtF9ZWfmK3V-WS5mzkjQ",
  authDomain: "eduadapt-18f2f.firebaseapp.com",
  projectId: "eduadapt-18f2f",
  storageBucket: "eduadapt-18f2f.firebasestorage.app",
  messagingSenderId: "109936681702",
  appId: "1:109936681702:web:7ecb4f2e4d2ab018f49127"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.fbAuth = auth;
window.fbDb = db;
window.fbHelpers = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
};
window.firebaseReady = true;
window.dispatchEvent(new Event('firebase-ready'));