/* ============================================================
   EduAdapt AI – login.js
   Lógica de la página de login
   ============================================================ */

import { loginWithEmail } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm || document.getElementById('stepAccountForm')) return;

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMsg      = document.getElementById('errorMsg');
  const loginBtn      = document.getElementById('loginBtn');
  const togglePass    = document.getElementById('togglePass');

  if (togglePass) {
    togglePass.addEventListener('click', () => {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = usernameInput.value.trim();
    const pass  = passwordInput.value.trim();
    errorMsg.classList.remove('visible');

    if (!email || !pass) {
      errorMsg.classList.add('visible');
      return;
    }

    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
      const user = await loginWithEmail(email, pass);
      // Obtener perfil de Firestore
      const uref = window.fbHelpers.doc(window.fbDb, 'users', user.uid);
      const snap = await window.fbHelpers.getDoc(uref);
      const profile = snap.exists() ? snap.data() : { fullname: email.split('@')[0] };

      sessionStorage.setItem('edu_logged', '1');
      sessionStorage.setItem('edu_user', profile.fullname || email);
      sessionStorage.setItem('edu_email', email);
      sessionStorage.setItem('edu_uid', user.uid);

      if (profile.S) {
        sessionStorage.setItem('edu_S', JSON.stringify({
          ...profile.S,
          selfLevel: profile.selfLevel || 'mid'
        }));
      }

      setTimeout(() => { window.location.href = 'index.html'; }, 400);
    } catch (err) {
      console.error('[Login]', err.code);
      errorMsg.classList.add('visible');
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  });
});