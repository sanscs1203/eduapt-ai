/* ============================================================
   EduAdapt AI – register.js
   Lógica de la página de registro con diagnóstico
   ============================================================ */

import { registerWithEmail } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const regStep1 = document.getElementById('stepAccountForm');
  if (!regStep1) return;

  const regState = {
    fullname: '', email: '', password: '',
    selfLevel: null, preferences: [], studyTime: null, quizAnswers: []
  };

  const QUIZ_QUESTIONS = [
    { difficulty:1, question:'Resuelve para x: <code>2x + 6 = 14</code>',
      options:['x = 2','x = 4','x = 6','x = 10'], correct:1 },
    { difficulty:1, question:'Simplifica: <code>3a + 5a − 2a</code>',
      options:['6a','7a','5a','10a'], correct:0 },
    { difficulty:1, question:'Evalúa si <code>x = 3</code>: <code>x² − 2x + 1</code>',
      options:['2','4','6','8'], correct:1 },
    { difficulty:1, question:'Factoriza: <code>x² − 9</code>',
      options:['(x−3)²','(x+3)(x−3)','(x−9)(x+1)','No se puede'], correct:1 },
    { difficulty:2, question:'Resuelve: <code>x² − 5x + 6 = 0</code>',
      options:['x=1, x=6','x=2, x=3','x=−2, x=−3','x=0, x=5'], correct:1 },
    { difficulty:2, question:'Resuelve el sistema: <code>x + y = 7</code>, <code>x − y = 1</code>',
      options:['x=3, y=4','x=4, y=3','x=5, y=2','x=2, y=5'], correct:1 },
    { difficulty:2, question:'Simplifica: <code>(x² · x³) / x⁴</code>',
      options:['x','x²','x⁵','1/x'], correct:0 },
    { difficulty:2, question:'Racionaliza: <code>1 / √2</code>',
      options:['√2','√2 / 2','2 / √2','1 / 2'], correct:1 }
  ];

  function gotoStep(n) {
    document.querySelectorAll('.register-step').forEach(p => p.classList.remove('active'));
    const panel = document.querySelector(`[data-step-panel="${n}"]`);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.step-dot').forEach(d => {
      const s = parseInt(d.dataset.step);
      d.classList.remove('active','done');
      if (s === n) d.classList.add('active');
      else if (s < n) d.classList.add('done');
    });
    document.querySelectorAll('.step-line').forEach((l, i) => l.classList.toggle('done', i+1 < n));
    document.querySelectorAll('.step-label').forEach((l, i) => l.classList.toggle('active', i+1 === n));
  }

  regStep1.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullname = document.getElementById('regFullname').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errBox   = document.getElementById('accountError');
    const errText  = document.getElementById('accountErrorText');
    errBox.classList.remove('visible');

    if (!fullname || !email || !password) { errText.textContent='Completa todos los campos'; errBox.classList.add('visible'); return; }
    if (password.length < 6)             { errText.textContent='Contraseña mínimo 6 caracteres'; errBox.classList.add('visible'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email))  { errText.textContent='Correo no válido'; errBox.classList.add('visible'); return; }

    regState.fullname = fullname;
    regState.email    = email;
    regState.password = password;
    gotoStep(2);
  });

  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      regState.selfLevel = card.dataset.level;
      document.getElementById('next2').disabled = false;
    });
  });
  document.getElementById('back2').addEventListener('click', () => gotoStep(1));
  document.getElementById('next2').addEventListener('click', () => { if (regState.selfLevel) gotoStep(3); });

  function checkStep3() {
    const hasPrefs = document.querySelectorAll('.pref-check:checked').length > 0;
    const hasTime  = document.querySelector('input[name="time"]:checked') !== null;
    document.getElementById('next3').disabled = !(hasPrefs && hasTime);
  }
  document.querySelectorAll('.pref-check').forEach(c => c.addEventListener('change', checkStep3));
  document.querySelectorAll('input[name="time"]').forEach(r => r.addEventListener('change', checkStep3));
  document.getElementById('back3').addEventListener('click', () => gotoStep(2));
  document.getElementById('next3').addEventListener('click', () => {
    regState.preferences = Array.from(document.querySelectorAll('.pref-check:checked')).map(c => c.value);
    regState.studyTime   = document.querySelector('input[name="time"]:checked').value;
    renderQuiz();
    gotoStep(4);
  });

  function renderQuiz() {
    regState.quizAnswers = Array(QUIZ_QUESTIONS.length).fill(null);
    showQuizQuestion(0);
  }

  let currentQuiz = 0;
  function showQuizQuestion(idx) {
    currentQuiz = idx;
    const q = QUIZ_QUESTIONS[idx];
    const container = document.getElementById('quizContainer');
    container.innerHTML = `<div class="quiz-question">${q.question}</div><div class="quiz-options" id="quizOpts"></div>`;
    const opts = document.getElementById('quizOpts');
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'quiz-option';
      div.textContent = opt;
      if (regState.quizAnswers[idx] === i) div.classList.add('selected');
      div.addEventListener('click', () => {
        opts.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        div.classList.add('selected');
        regState.quizAnswers[idx] = i;
        setTimeout(() => {
          if (idx < QUIZ_QUESTIONS.length - 1) {
            showQuizQuestion(idx + 1);
            updateQuizProgress(idx + 1);
          } else {
            updateQuizProgress(QUIZ_QUESTIONS.length);
            document.getElementById('submitQuiz').disabled = false;
          }
        }, 250);
      });
      opts.appendChild(div);
    });
  }

  function updateQuizProgress(answeredCount) {
    document.getElementById('quizCounter').textContent =
      `Pregunta ${Math.min(answeredCount+1, QUIZ_QUESTIONS.length)} / ${QUIZ_QUESTIONS.length}`;
    document.getElementById('quizBarFill').style.width =
      Math.max(12.5, (answeredCount/QUIZ_QUESTIONS.length)*100) + '%';
  }

  document.getElementById('back4').addEventListener('click', () => gotoStep(3));

  function computeStudentState(r) {
    let correct = 0;
    r.quizAnswers.forEach((ans, i) => { if (ans === QUIZ_QUESTIONS[i].correct) correct++; });
    const a = correct / QUIZ_QUESTIONS.length;
    const selfMap = { low:0.3, mid:0.6, high:0.9 };
    const d = +(0.4 * selfMap[r.selfLevel] + 0.6 * a).toFixed(2);
    return { a:+a.toFixed(2), t:0.5, f:0.5, d };
  }

  document.getElementById('submitQuiz').addEventListener('click', async () => {
    const btn = document.getElementById('submitQuiz');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const S = computeStudentState(regState);
      // Registrar en Firebase Auth
      const user = await registerWithEmail(regState.email, regState.password);
      const uid = user.uid;

      const userDoc = {
        uid, fullname:regState.fullname, email:regState.email,
        selfLevel:regState.selfLevel, preferences:regState.preferences,
        studyTime:regState.studyTime, quizAnswers:regState.quizAnswers,
        quizCorrect: regState.quizAnswers.filter((a,i)=>a===QUIZ_QUESTIONS[i].correct).length,
        quizTotal: QUIZ_QUESTIONS.length,
        S, createdAt: window.fbHelpers.serverTimestamp(),
      };
      await window.fbHelpers.setDoc(window.fbHelpers.doc(window.fbDb,'users',uid), userDoc);

      sessionStorage.setItem('edu_logged','1');
      sessionStorage.setItem('edu_user', regState.fullname);
      sessionStorage.setItem('edu_email', regState.email);
      sessionStorage.setItem('edu_uid', uid);
      sessionStorage.setItem('edu_S', JSON.stringify({ ...S, selfLevel: regState.selfLevel }));

      // Renderizar resumen
      const correct = regState.quizAnswers.filter((a,i)=>a===QUIZ_QUESTIONS[i].correct).length;
      const total = QUIZ_QUESTIONS.length;
      let levelCat, levelClass;
      if (S.d >= 0.7)       { levelCat='Avanzado';   levelClass='high'; }
      else if (S.d >= 0.45) { levelCat='Intermedio'; levelClass='mid';  }
      else                  { levelCat='Básico';     levelClass='low';  }

      const prefLabels = { formulas:'Fórmulas', text:'Texto', video:'Videos', exercises:'Ejercicios', examples:'Ejemplos' };
      const timeLabels = { 'lt2':'< 2 h/semana', '2-5':'2–5 h/semana', '5-10':'5–10 h/semana', 'gt10':'> 10 h/semana' };

      document.getElementById('stateSummary').innerHTML = `
        <div class="state-row"><span class="state-key">Quiz diagnóstico</span><span class="state-value">${correct} / ${total}</span></div>
        <div class="state-row"><span class="state-key">Nivel detectado</span><span class="state-value ${levelClass}">${levelCat}</span></div>
        <div class="state-row"><span class="state-key">S = [a, t, f, d]</span><span class="state-value">[${S.a}, ${S.t}, ${S.f}, ${S.d}]</span></div>
        <div class="state-row"><span class="state-key">Preferencias</span><span class="state-value" style="font-size:0.8rem">${regState.preferences.map(p=>prefLabels[p]).join(', ')}</span></div>
        <div class="state-row"><span class="state-key">Tiempo disponible</span><span class="state-value" style="font-size:0.8rem">${timeLabels[regState.studyTime]}</span></div>
        <div class="state-row"><span class="state-key">Almacenamiento</span><span class="state-value high" style="font-size:0.8rem">✓ Guardado en Firebase</span></div>
      `;

      gotoStep(5);
      document.querySelectorAll('.step-dot').forEach(d => d.classList.add('done'));
      document.querySelectorAll('.step-line').forEach(l => l.classList.add('done'));
    } catch (error) {
        console.log('[Register] Error completo:', error);
        if (error && error.message) {
            console.log('[Register]', error.message);
        } else if (typeof error === 'string') {
            console.log('[Register]', error);
        } else {
            console.log('[Register] Error inesperado:', JSON.stringify(error));
        }
    }
  });

  document.getElementById('goToApp').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});