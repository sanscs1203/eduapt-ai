/* ============================================================
   EduAdapt AI – session.js
   Gestión de sesión de aprendizaje (backend-driven)
   ============================================================ */

let activeSession = null;   // { sessionId, topic, startTime, questions:[] }
let pendingQuestion = null;
let pendingFeedback = null;
let currentTopic = null;
let studentS = { a: 0.5, t: 0.5, f: 0.5, d: 0.5, selfLevel: 'mid' };

function updateStatePanelUI() {
  const aEl = document.getElementById('stateA');
  const dEl = document.getElementById('stateD');
  const lEl = document.getElementById('stateLevel');
  if (!aEl) return;
  aEl.textContent = studentS.a.toFixed(2);
  dEl.textContent = studentS.d.toFixed(2);
  // Nivel legible
  const tier = getTier(studentS);
  const colors = {
    'Challenge':     { label: '🏆 Avanzado',     color: '#10B981' },
    'Advancement':   { label: '📈 Progresando',   color: '#3B82F6' },
    'Reinforcement': { label: '📚 Consolidando',  color: '#F59E0B' },
    'Remedial':      { label: '🔰 Reforzando',    color: '#EF4444' }
  };
  const info = colors[tier];
  lEl.textContent  = info.label;
  lEl.style.color  = info.color;
}

function getTier(S) {
  if (S.a >= 0.85) return 'Challenge';
  if (S.a >= 0.70) return 'Advancement';
  if (S.a >= 0.45) return 'Reinforcement';
  return 'Remedial';
}

/* Inicia sesión en backend y obtiene primera pregunta */
async function startSession(topic) {
  if (activeSession && activeSession.topic === topic) return; // ya activa
  if (activeSession) await closeSession(false);

  const uid = sessionStorage.getItem('edu_uid');
  const response = await fetch(`${CONFIG.API_BASE_URL}/api/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      topic,
      mode: pilotMode,
      S: studentS
    })
  });
  if (!response.ok) throw new Error('Error al iniciar sesión');
  const data = await response.json();
  activeSession = {
    sessionId: data.session_id,
    topic,
    startTime: Date.now(),
    questions: []
  };
  currentTopic = topic;
  return data.first_question;  // { id, question, difficulty, type, ... }
}

/* Envía respuesta del estudiante */
async function submitAnswer(userAnswer) {
  if (!pendingQuestion) return null;
  const responseTimeSec = (Date.now() - pendingQuestion.deliveredAt) / 1000;

  const res = await fetch(`${CONFIG.API_BASE_URL}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: activeSession.sessionId,
      question_id: pendingQuestion.id,
      user_answer: userAnswer,
      response_time: responseTimeSec,
      uid: sessionStorage.getItem('edu_uid')
    })
  });
  const data = await res.json();
  // data = { is_correct, explanation, S_new, next_question, resource }
  studentS = data.S_new;
  updateStatePanelUI();
  persistS();
  return data;
}

async function closeSession(showSummary = true) {
  if (!activeSession || activeSession.questions.length === 0) {
    activeSession = null;
    return null;
  }
  const session = activeSession;
  activeSession = null;
  pendingFeedback = null;

  const res = await fetch(`${CONFIG.API_BASE_URL}/api/session/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: session.sessionId, uid: sessionStorage.getItem('edu_uid') })
  });
  if (!res.ok) return null;
  const metrics = await res.json();
  if (showSummary && metrics) {
    // El backend devuelve métricas y recomendaciones
    return metrics;
  }
  return null;
}

function persistS() {
  sessionStorage.setItem('edu_S', JSON.stringify(studentS));
  // También se podría enviar al backend, pero el backend ya lo actualiza
}