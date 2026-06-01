// frontend/js/firebase-init.js
// Script de inicialización de Firebase para el frontend.
// Configura las instancias de Auth y Firestore, y las expone globalmente
// para que otros módulos (auth.js, script.js) puedan usarlas.

// ============================================================================
// 1. Importación de los módulos necesarios de Firebase (SDK modular)
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================================
// 2. Configuración del proyecto Firebase (credenciales públicas)
// ============================================================================
// NOTA: Las claves API son seguras en el frontend porque están restringidas
// por las reglas de seguridad de Firebase y por la configuración de dominios.
// En producción, se recomienda usar variables de entorno y restringir dominios.
const firebaseConfig = {
  apiKey: "AIzaSyCLvJ3Bc05N9jQDtF9ZWfmK3V-WS5mzkjQ",
  authDomain: "eduadapt-18f2f.firebaseapp.com",
  projectId: "eduadapt-18f2f",
  storageBucket: "eduadapt-18f2f.firebasestorage.app",
  messagingSenderId: "109936681702",
  appId: "1:109936681702:web:7ecb4f2e4d2ab018f49127"
};

// ============================================================================
// 3. Inicialización de los servicios de Firebase
// ============================================================================
/** Instancia principal de la aplicación Firebase */
const app = initializeApp(firebaseConfig);

/** Instancia del servicio de autenticación (Auth) */
const auth = getAuth(app);

/** Instancia del servicio de base de datos Firestore */
const db = getFirestore(app);

// ============================================================================
// 4. Exposición de servicios y helpers a nivel global (window)
// ============================================================================
// Esto permite que otros scripts (no modulares o importados dinámicamente)
// accedan a las funciones de Firebase sin necesidad de re-importarlas.
// Se utiliza principalmente para la compatibilidad con código legacy
// y para facilitar la integración con el HTML existente.

/** Objeto auth de Firebase (para login/register/logout) */
window.fbAuth = auth;

/** Instancia de Firestore */
window.fbDb = db;

/** Objeto con helpers agrupados para autenticación y Firestore */
window.fbHelpers = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
};

// ============================================================================
// 5. Señal de que Firebase está listo
// ============================================================================
// Se establece una bandera global y se dispara un evento personalizado
// para que otros scripts (como auth.js) puedan esperar a que Firebase esté
// completamente inicializado antes de realizar operaciones de autenticación.

/** Bandera global que indica que Firebase ya está listo */
window.firebaseReady = true;

/**
 * Evento personalizado que notifica a los suscriptores que Firebase está listo.
 * El nombre del evento se define en config.js como 'firebase-ready'.
 */
window.dispatchEvent(new Event('firebase-ready'));