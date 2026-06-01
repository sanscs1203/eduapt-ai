/* ============================================================
   EduAdapt AI – auth.js
   Funciones de autenticación con Firebase Auth
   ============================================================ */

import { CONFIG } from './config.js';

/**
 * Espera de forma asíncrona a que Firebase esté completamente inicializado.
 * Se resuelve cuando la propiedad `window.firebaseReady` es `true` o se dispara
 * el evento definido en `CONFIG.FIREBASE_READY_EVENT`.
 *
 * @returns {Promise<void>} Promesa que se resuelve cuando Firebase está listo.
 */
function onFirebaseReadyAsync() {
  return new Promise((resolve) => {
    // Si ya está listo, resolvemos inmediatamente
    if (window.firebaseReady) {
      resolve();
    } else {
      // En caso contrario, esperamos el evento personalizado una sola vez
      window.addEventListener(CONFIG.FIREBASE_READY_EVENT, resolve, { once: true });
    }
  });
}

/**
 * Inicia sesión con correo electrónico y contraseña utilizando Firebase Auth.
 *
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<import('firebase/auth').User>} Promesa que resuelve con el objeto `User` de Firebase.
 * @throws {Error} Si las credenciales son incorrectas o ocurre un error en la autenticación.
 */
export async function loginWithEmail(email, password) {
  // Aseguramos que Firebase esté listo antes de intentar la autenticación
  await onFirebaseReadyAsync();
  // Utilizamos los helpers expuestos globalmente por Firebase (ver config.js)
  const cred = await window.fbHelpers.signInWithEmailAndPassword(window.fbAuth, email, password);
  return cred.user;
}

/**
 * Registra un nuevo usuario con correo electrónico y contraseña.
 *
 * @param {string} email - Correo electrónico del nuevo usuario.
 * @param {string} password - Contraseña del nuevo usuario.
 * @returns {Promise<import('firebase/auth').User>} Promesa que resuelve con el objeto `User` recién creado.
 * @throws {Error} Si el correo ya está registrado o la contraseña no cumple los requisitos.
 */
export async function registerWithEmail(email, password) {
  await onFirebaseReadyAsync();
  const cred = await window.fbHelpers.createUserWithEmailAndPassword(window.fbAuth, email, password);
  return cred.user;
}

/**
 * Cierra la sesión del usuario actual.
 * Limpia también el almacenamiento de sesión (`sessionStorage`).
 *
 * @returns {Promise<void>} Promesa que se resuelve cuando el cierre de sesión ha finalizado.
 */
export async function logout() {
  if (window.fbAuth) {
    // Cierra la sesión en Firebase Auth
    await window.fbHelpers.signOut(window.fbAuth);
  }
  // Elimina cualquier dato de sesión almacenado localmente
  sessionStorage.clear();
}