/* ============================================================
   EduAdapt AI – auth.js
   Funciones de autenticación con Firebase Auth
   ============================================================ */

import { CONFIG } from './config.js';

export async function loginWithEmail(email, password) {
  await onFirebaseReadyAsync();
  const cred = await window.fbHelpers.signInWithEmailAndPassword(window.fbAuth, email, password);
  return cred.user;
}

export async function registerWithEmail(email, password) {
  await onFirebaseReadyAsync();
  const cred = await window.fbHelpers.createUserWithEmailAndPassword(window.fbAuth, email, password);
  return cred.user;
}

export async function logout() {
  if (window.fbAuth) {
    await window.fbHelpers.signOut(window.fbAuth);
  }
  sessionStorage.clear();
}

function onFirebaseReadyAsync() {
  return new Promise(resolve => {
    if (window.firebaseReady) resolve();
    else window.addEventListener(CONFIG.FIREBASE_READY_EVENT, resolve, { once: true });
  });
}