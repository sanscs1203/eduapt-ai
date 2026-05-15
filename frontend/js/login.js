/* ============================================================
   EduAdapt AI – login.js
   Lógica de la página de login
   Compatible con Vector S multitema
   ============================================================ */

import { loginWithEmail } from './auth.js';

// ============================================================
// Inicialización
// ============================================================

const loginForm = document.getElementById('loginForm');

// Solo ejecutar si existe el formulario de login
// y NO existe el formulario de registro
if (loginForm && !document.getElementById('stepAccountForm')) {

  const usernameInput =
    document.getElementById('username');

  const passwordInput =
    document.getElementById('password');

  const errorMsg =
    document.getElementById('errorMsg');

  const loginBtn =
    document.getElementById('loginBtn');

  const togglePass =
    document.getElementById('togglePass');

  // ==========================================================
  // Toggle password
  // ==========================================================

  if (togglePass) {

    togglePass.addEventListener('click', () => {

      passwordInput.type =
        passwordInput.type === 'password'
          ? 'text'
          : 'password';
    });
  }

  // ==========================================================
  // Submit login
  // ==========================================================

  loginForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    const email =
      usernameInput.value.trim();

    const pass =
      passwordInput.value.trim();

    errorMsg.classList.remove('visible');

    // ========================================================
    // Validación básica
    // ========================================================

    if (!email || !pass) {

      errorMsg.classList.add('visible');

      return;
    }

    loginBtn.classList.add('loading');

    loginBtn.disabled = true;

    try {

      // ======================================================
      // Firebase Auth
      // ======================================================

      const user =
        await loginWithEmail(email, pass);

      // ======================================================
      // Firestore profile
      // ======================================================

      const userRef = window.fbHelpers.doc(
        window.fbDb,
        'users',
        user.uid
      );

      const snap =
        await window.fbHelpers.getDoc(userRef);

      const profile =
        snap.exists()
          ? snap.data()
          : {
              fullname:
                email.split('@')[0]
            };

      // ======================================================
      // Persistencia sesión
      // ======================================================

      sessionStorage.setItem(
        'edu_logged',
        '1'
      );

      sessionStorage.setItem(
        'edu_user',
        profile.fullname || email
      );

      sessionStorage.setItem(
        'edu_email',
        email
      );

      sessionStorage.setItem(
        'edu_uid',
        user.uid
      );

      // ======================================================
      // NUEVO VECTOR S MULTITEMA
      // Guardamos el objeto completo
      // SIN modificar estructura
      // ======================================================

      if (profile.S) {

        sessionStorage.setItem(
          'edu_S',
          JSON.stringify(profile.S)
        );
      }

      // ======================================================
      // Redirect
      // ======================================================

      setTimeout(() => {

        window.location.href = 'index.html';

      }, 400);

    } catch (err) {

      console.error('[Login]', err);

      errorMsg.classList.add('visible');

      loginBtn.classList.remove('loading');

      loginBtn.disabled = false;
    }
  });
}