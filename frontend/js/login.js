/* ============================================================
   EduAdapt AI – login.js
   Lógica de la página de login (autenticación)
   Compatible con Vector S multitema
   ============================================================ */

import { loginWithEmail } from './auth.js';

// ============================================================
// Inicialización: solo ejecutar si estamos en la página de login
// (no en la de registro, que tiene un formulario con id 'stepAccountForm')
// ============================================================

const loginForm = document.getElementById('loginForm');

// Verificar que el formulario de login existe y NO existe el de registro
if (loginForm && !document.getElementById('stepAccountForm')) {

  // Referencias a elementos del DOM
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');
  const togglePass = document.getElementById('togglePass');

  // ==========================================================
  // Toggle de visibilidad de la contraseña (mostrar/ocultar)
  // ==========================================================
  if (togglePass) {
    togglePass.addEventListener('click', () => {
      // Cambiar el tipo de input entre 'password' y 'text'
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
  }

  // ==========================================================
  // Manejo del envío del formulario de login
  // ==========================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar recarga de la página

    // Obtener valores del formulario
    const name = usernameInput.value.trim();   // nombre de usuario (no email)
    const pass = passwordInput.value.trim();

    // Ocultar cualquier mensaje de error previo
    errorMsg.classList.remove('visible');

    // Validación básica: campos no vacíos
    if (!name || !pass) {
      errorMsg.classList.add('visible');
      return;
    }

    // Mostrar estado de carga en el botón
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
      // --------------------------------------------------------
      // 1. Buscar el email asociado al nombre de usuario en Firestore
      //    La colección 'usernames' mapea nombre -> email
      // --------------------------------------------------------
      const usernameRef = window.fbHelpers.doc(window.fbDb, 'usernames', name);
      const usernameSnap = await window.fbHelpers.getDoc(usernameRef);

      if (!usernameSnap.exists()) {
        // Si no existe el nombre de usuario, lanzar error similar a usuario no encontrado
        throw new Error('auth/user-not-found');
      }

      const email = usernameSnap.data().email;

      // --------------------------------------------------------
      // 2. Autenticar con Firebase Auth usando email y contraseña
      // --------------------------------------------------------
      const user = await loginWithEmail(email, pass);

      // --------------------------------------------------------
      // 3. Obtener el perfil del usuario desde Firestore (colección 'users')
      // --------------------------------------------------------
      const userRef = window.fbHelpers.doc(window.fbDb, 'users', user.uid);
      const snap = await window.fbHelpers.getDoc(userRef);

      const profile = snap.exists() ? snap.data() : { fullname: name };

      // --------------------------------------------------------
      // 4. Persistencia de la sesión en sessionStorage
      //    Los datos se usarán durante toda la sesión de navegación
      // --------------------------------------------------------
      sessionStorage.setItem('edu_logged', '1');
      sessionStorage.setItem('edu_user', profile.fullname || name);
      sessionStorage.setItem('edu_email', email);
      sessionStorage.setItem('edu_uid', user.uid);

      // Guardar el vector de estado del estudiante (S) si existe en el perfil
      if (profile.S) {
        sessionStorage.setItem('edu_S', JSON.stringify(profile.S));
      }

      // Pequeño retraso para asegurar que el almacenamiento se complete
      // y dar feedback visual antes de redirigir
      setTimeout(() => {
        window.location.href = 'index.html'; // Redirigir al tutor
      }, 400);

    } catch (err) {
      // --------------------------------------------------------
      // Manejo de errores de autenticación
      // --------------------------------------------------------
      console.error('[Login] Error:', err);

      // Mostrar mensaje genérico para errores comunes
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        // El mensaje de error ya se muestra con la clase 'visible'
        // No es necesario personalizar más aquí
      }

      // Mostrar el mensaje de error en la interfaz
      errorMsg.classList.add('visible');

      // Restaurar el estado del botón
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  });
}