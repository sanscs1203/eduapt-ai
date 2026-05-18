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

    const name = usernameInput.value.trim();   // ahora es nombre, no email
    const pass = passwordInput.value.trim();

    errorMsg.classList.remove('visible');

    if (!name || !pass) {
        errorMsg.classList.add('visible');
        return;
    }

    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        // 1. Buscar email sintético asociado al nombre
        const usernameRef = window.fbHelpers.doc(window.fbDb, 'usernames', name);
        const usernameSnap = await window.fbHelpers.getDoc(usernameRef);

        if (!usernameSnap.exists()) {
            throw new Error('auth/user-not-found');
        }

        const email = usernameSnap.data().email;

        // 2. Autenticar con Firebase
        const user = await loginWithEmail(email, pass);

        // 3. Obtener perfil del usuario
        const userRef = window.fbHelpers.doc(window.fbDb, 'users', user.uid);
        const snap = await window.fbHelpers.getDoc(userRef);

        const profile = snap.exists() ? snap.data() : { fullname: name };

        // 4. Persistencia de sesión
        sessionStorage.setItem('edu_logged', '1');
        sessionStorage.setItem('edu_user', profile.fullname || name);
        sessionStorage.setItem('edu_email', email);
        sessionStorage.setItem('edu_uid', user.uid);

        if (profile.S) {
            sessionStorage.setItem('edu_S', JSON.stringify(profile.S));
        }

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 400);

    } catch (err) {
        console.error('[Login]', err);

        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            // error de autenticación
        }

        errorMsg.classList.add('visible');
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
});

}