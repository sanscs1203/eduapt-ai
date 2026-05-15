/* ============================================================
   EduAdapt AI – register.js
   Registro adaptativo con diagnóstico multitema
   y Vector S pedagógico mejorado
   ============================================================ */

import { registerWithEmail } from './auth.js';
import { CONFIG } from './config.js';

const regStep1 = document.getElementById('stepAccountForm');

if (regStep1) {

  /* ============================================================
     ESTADO GLOBAL DEL REGISTRO
     ============================================================ */
  const regState = {
    fullname: '',
    email: '',
    password: '',
    selfLevel: null,
    preferences: [],
    studyTime: null,
    quizAnswers: []
  };

  /* ============================================================
     CONFIGURACIÓN PEDAGÓGICA
     ============================================================ */

  const LEARNING_RATE = 0.08;

  const DEFAULT_TOPIC_STATE = {
    mastery: 0.5,
    confidence: 0.2,
    attempts: 0,
    correct: 0,
    streak: 0,
    last_interaction: null
  };

  /* ============================================================
     BANCO DE PREGUNTAS
     Cada pregunta ahora tiene:
     - topic
     - difficulty
     - concept
     ============================================================ */

  const QUIZ_QUESTIONS = [

    // ÁLGEBRA
    {
      topic: 'algebra',
      concept: 'ecuaciones_lineales',
      difficulty: 1,
      question: 'Resuelve para x: <code>2x + 6 = 14</code>',
      options: ['x = 2', 'x = 4', 'x = 6', 'x = 10'],
      correct: 1
    },

    {
      topic: 'algebra',
      concept: 'expresiones_algebraicas',
      difficulty: 1,
      question: 'Simplifica: <code>3a + 5a − 2a</code>',
      options: ['6a', '7a', '5a', '10a'],
      correct: 0
    },

    {
      topic: 'funciones',
      concept: 'evaluacion_funciones',
      difficulty: 2,
      question: 'Si <code>f(x) = 2x + 5</code>, ¿cuánto es <code>f(4)</code>?',
      options: ['9', '11', '13', '15'],
      correct: 2
    },

    // FACTORIZACIÓN
    {
      topic: 'polinomios',
      concept: 'factorizacion',
      difficulty: 2,
      question: 'Factoriza: <code>x² − 9</code>',
      options: [
        '(x−3)²',
        '(x+3)(x−3)',
        '(x−9)(x+1)',
        'No se puede'
      ],
      correct: 1
    },

    {
      topic: 'polinomios',
      concept: 'productos_notables',
      difficulty: 2,
      question: '¿Cuál es el resultado de <code>(x + 2)(x + 3)</code>?',
      options: [
        'x² + 5x + 6',
        'x² + 6x + 5',
        'x² + 5x + 5',
        'x² + 6'
      ],
      correct: 0
    },

    // SISTEMAS
    {
      topic: 'sistemas',
      concept: 'sistemas_lineales',
      difficulty: 3,
      question: 'Resuelve el sistema: <code>x + y = 5; x - y = 1</code>',
      options: [
        'x=2, y=3',
        'x=3, y=2',
        'x=4, y=1',
        'x=1, y=4'
      ],
      correct: 1
    },

    // POTENCIAS
    {
      topic: 'potencias',
      concept: 'leyes_exponentes',
      difficulty: 3,
      question: 'Simplifica: <code>(2x³y²)²</code>',
      options: [
        '4x⁶y⁴',
        '2x⁶y⁴',
        '4x⁵y⁴',
        '4x⁶y²'
      ],
      correct: 0
    },

    // LOGARITMOS
    {
      topic: 'logaritmos',
      concept: 'definicion_logaritmo',
      difficulty: 3,
      question: '¿Qué valor de x satisface <code>log₂(x) = 3</code>?',
      options: [
        'x = 6',
        'x = 8',
        'x = 9',
        'x = 5'
      ],
      correct: 1
    },

    // ECUACIONES
    {
      topic: 'algebra',
      concept: 'ecuaciones_lineales',
      difficulty: 2,
      question: 'Encuentra el valor de x en: <code>3(x - 2) = 12</code>',
      options: ['x = 4', 'x = 6', 'x = 8', 'x = 2'],
      correct: 1
    },

    // CUADRÁTICAS
    {
      topic: 'polinomios',
      concept: 'cuadraticas',
      difficulty: 2,
      question: 'Evalúa si <code>x = 3</code>: <code>x² − 2x + 1</code>',
      options: ['2', '4', '6', '8'],
      correct: 1
    }
  ];

  let currentQuizIdx = 0;

  /* ============================================================
     NAVEGACIÓN
     ============================================================ */

  window.gotoStep = function(step) {

    document.querySelectorAll('.reg-step')
      .forEach(s => s.classList.remove('active'));

    document
      .getElementById(`step${step}`)
      .classList.add('active');

    const dots = document.querySelectorAll('.step-dot');
    const lines = document.querySelectorAll('.step-line');

    dots.forEach((d, i) => {
      if (i < step) d.classList.add('active');
      if (i < step - 1 && lines[i]) {
        lines[i].classList.add('active');
      }
    });

    if (step === 3) startQuiz();
    if (step === 4) renderSummary();
  };

  /* ============================================================
     PASO 1 — CUENTA
     ============================================================ */

  const accountForm = document.getElementById('accountForm');

  if (accountForm) {

    accountForm.addEventListener('submit', (e) => {

      e.preventDefault();

      regState.fullname =
        document.getElementById('regFullname').value;

      regState.email =
        document.getElementById('regEmail').value;

      regState.password =
        document.getElementById('regPassword').value;

      gotoStep(2);
    });
  }

  /* ============================================================
     PASO 2 — PERFIL
     ============================================================ */

  window.setSelfLevel = function(level) {

    regState.selfLevel = level;

    document.querySelectorAll('.level-card')
      .forEach(c => c.classList.remove('selected'));

    event.currentTarget.classList.add('selected');
  };

  window.togglePref = function(pref) {

    const idx = regState.preferences.indexOf(pref);

    if (idx > -1) {
      regState.preferences.splice(idx, 1);
    } else {
      regState.preferences.push(pref);
    }

    event.currentTarget.classList.toggle('selected');
  };

  /* ============================================================
     PASO 3 — QUIZ DIAGNÓSTICO
     ============================================================ */

  function startQuiz() {

    currentQuizIdx = 0;
    regState.quizAnswers = [];

    showQuestion();
  }

  function showQuestion() {

    const q = QUIZ_QUESTIONS[currentQuizIdx];

    const container =
      document.getElementById('quizContainer');

    container.innerHTML = `
      <div class="quiz-q">

        <p class="quiz-num">
          Pregunta ${currentQuizIdx + 1}
          de ${QUIZ_QUESTIONS.length}
        </p>

        <div class="quiz-topic">
          Tema: ${q.topic}
        </div>

        <h3>${q.question}</h3>

        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button
              class="opt-btn"
              onclick="selectOption(${i})"
            >
              ${opt}
            </button>
          `).join('')}
        </div>

      </div>
    `;

    const progress =
      (currentQuizIdx / QUIZ_QUESTIONS.length) * 100;

    document.getElementById('quizProgress')
      .style.width = `${progress}%`;
  }

  window.selectOption = function(idx) {

    const q = QUIZ_QUESTIONS[currentQuizIdx];

    regState.quizAnswers.push({

      questionIdx: currentQuizIdx,

      topic: q.topic,

      concept: q.concept,

      difficulty: q.difficulty,

      selected: idx,

      isCorrect: idx === q.correct,

      timestamp: new Date().toISOString()
    });

    currentQuizIdx++;

    if (currentQuizIdx < QUIZ_QUESTIONS.length) {
      showQuestion();
    } else {
      gotoStep(4);
    }
  };

  /* ============================================================
     MOTOR PEDAGÓGICO
     ============================================================ */

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function createInitialTopicState(baseMastery = 0.5) {

    return {
      ...DEFAULT_TOPIC_STATE,
      mastery: baseMastery
    };
  }

  function computeTopicMastery(topicAnswers) {

    if (!topicAnswers.length) {
      return createInitialTopicState(0.5);
    }

    let mastery = 0.5;
    let streak = 0;
    let correctCount = 0;

    topicAnswers.forEach(answer => {

      const weight =
        LEARNING_RATE * answer.difficulty;

      if (answer.isCorrect) {

        mastery += weight;

        correctCount++;

        streak = streak >= 0
          ? streak + 1
          : 1;

      } else {

        mastery -= weight;

        streak = streak <= 0
          ? streak - 1
          : -1;
      }
    });

    mastery = clamp(mastery);

    const confidence =
      clamp(topicAnswers.length / 10);

    return {

      mastery,

      confidence,

      attempts: topicAnswers.length,

      correct: correctCount,

      streak,

      last_interaction:
        new Date().toISOString()
    };
  }

  function buildVectorS() {

    const groupedByTopic = {};

    CONFIG.TOPICS.forEach(topic => {
      groupedByTopic[topic] = [];
    });

    regState.quizAnswers.forEach(answer => {

      if (!groupedByTopic[answer.topic]) {
        groupedByTopic[answer.topic] = [];
      }

      groupedByTopic[answer.topic].push(answer);
    });

    const a_temas = {};

    let masterySum = 0;
    let topicCount = 0;

    Object.keys(groupedByTopic).forEach(topic => {

      const state =
        computeTopicMastery(groupedByTopic[topic]);

      a_temas[topic] = state;

      masterySum += state.mastery;
      topicCount++;
    });

    const globalMastery =
      topicCount > 0
        ? masterySum / topicCount
        : 0.5;

    return {

      a_temas,

      d_global: clamp(globalMastery),

      profile: {

        estimated_level:
          globalMastery >= 0.8
            ? 'advanced'
            : globalMastery >= 0.6
              ? 'intermediate'
              : 'basic',

        learning_velocity:
          globalMastery >= 0.75
            ? 'fast'
            : globalMastery >= 0.45
              ? 'normal'
              : 'slow'
      },

      metadata: {

        diagnostic_version: 'v2',

        initial_diag_score: globalMastery,

        self_reported_level:
          regState.selfLevel || 'medium',

        total_questions:
          QUIZ_QUESTIONS.length,

        completed_at:
          new Date().toISOString()
      }
    };
  }

  /* ============================================================
     PASO 4 — RESUMEN
     ============================================================ */

  function renderSummary() {

    const correct =
      regState.quizAnswers
        .filter(a => a.isCorrect).length;

    const score =
      (correct / QUIZ_QUESTIONS.length) * 100;

    document.getElementById('summaryName')
      .textContent = regState.fullname;

    document.getElementById('summaryScore')
      .textContent = `${score.toFixed(0)}%`;

    const levelText =
      score >= 85
        ? 'Avanzado'
        : score >= 60
          ? 'Intermedio'
          : 'Básico';

    document.getElementById('summaryLevel')
      .textContent = levelText;
  }

  /* ============================================================
     FINALIZACIÓN DEL REGISTRO
     ============================================================ */

  async function finalizeRegistration() {

    const btn =
      document.getElementById('btnFinishRegister');

    const errDiv =
      document.getElementById('submitError');

    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
    }

    if (errDiv) {
      errDiv.classList.remove('visible');
    }

    try {

      /* ========================================================
         1. REGISTRO AUTH
         ======================================================== */

      const user = await registerWithEmail(
        regState.email,
        regState.password
      );

      /* ========================================================
         2. CONSTRUIR VECTOR S
         ======================================================== */

      const vectorS = buildVectorS();

      /* ========================================================
         3. GUARDAR FIRESTORE
         ======================================================== */

      const userRef = window.fbHelpers.doc(
        window.fbDb,
        'users',
        user.uid
      );

      await window.fbHelpers.setDoc(userRef, {

        fullname: regState.fullname,

        email: regState.email,

        selfLevel: regState.selfLevel,

        preferences: regState.preferences,

        S: vectorS,

        diagnosticAnswers: regState.quizAnswers,

        createdAt:
          window.fbHelpers.serverTimestamp()
      });

      /* ========================================================
         4. SESIÓN LOCAL
         ======================================================== */

      sessionStorage.setItem('edu_logged', '1');

      sessionStorage.setItem(
        'edu_user',
        regState.fullname
      );

      sessionStorage.setItem(
        'edu_uid',
        user.uid
      );

      sessionStorage.setItem(
        'edu_S',
        JSON.stringify(vectorS)
      );

      /* ========================================================
         5. UI FINAL
         ======================================================== */

      const avgMastery =
        (vectorS.d_global * 100).toFixed(0);

      const weakTopics = Object.entries(
        vectorS.a_temas
      )
      .filter(([_, v]) => v.mastery < 0.45)
      .map(([k]) => k);

      const infoFinal =
        document.getElementById('infoFinal');

      if (infoFinal) {

        infoFinal.innerHTML = `

          <div class="state-row">
            <span class="state-key">Usuario</span>
            <span class="state-value">
              ${regState.fullname}
            </span>
          </div>

          <div class="state-row">
            <span class="state-key">
              Dominio Global
            </span>
            <span class="state-value">
              ${avgMastery}%
            </span>
          </div>

          <div class="state-row">
            <span class="state-key">
              Nivel Detectado
            </span>
            <span class="state-value">
              ${vectorS.profile.estimated_level}
            </span>
          </div>

          <div class="state-row">
            <span class="state-key">
              Temas Analizados
            </span>
            <span class="state-value">
              ${Object.keys(vectorS.a_temas).length}
            </span>
          </div>

          <div class="state-row">
            <span class="state-key">
              Temas Débiles
            </span>
            <span class="state-value">
              ${weakTopics.length
                ? weakTopics.join(', ')
                : 'Ninguno'}
            </span>
          </div>

          <div class="state-row">
            <span class="state-key">
              Firebase
            </span>

            <span
              class="state-value high"
              style="font-size:0.8rem"
            >
              ✓ Persistido
            </span>
          </div>
        `;
      }

      gotoStep(5);

      document.querySelectorAll('.step-dot')
        .forEach(d => d.classList.add('done'));

      document.querySelectorAll('.step-line')
        .forEach(l => l.classList.add('done'));

    } catch (error) {

      console.error('[Register] Error:', error);

      if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
      }

      let mensaje =
        'Ocurrió un error inesperado.';

      if (
        error &&
        error.code === 'auth/email-already-in-use'
      ) {
        mensaje =
          'Este correo ya está registrado.';
      }

      if (errDiv) {

        errDiv.innerHTML = mensaje;

        errDiv.classList.add('visible');
      }
    }
  }

  window.finalizeRegistration = finalizeRegistration;
}