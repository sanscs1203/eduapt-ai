import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQxQEXOxb5b6gcf3QR1J2KpBq9xW7vJXo",
  authDomain: "eduadapt-18f2f.firebaseapp.com",
  projectId: "eduadapt-18f2f",
  storageBucket: "eduadapt-18f2f.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
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
  setDoc
};
window.firebaseReady = true;
window.dispatchEvent(new Event('firebase-ready'));