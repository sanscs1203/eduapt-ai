/* ============================================================
   EduAdapt AI – session.js
   Gestión de sesión de aprendizaje (backend-driven)
   ============================================================ */

import { CONFIG } from './config.js';

// Variables globales (se adjuntan a window para compartir con otros módulos)
window.activeSession = null;   // { sessionId, topic, startTime, questions:[] }
window.pendingQuestion = null;
window.pendingFeedback = null;
window.currentTopic = null;
window.studentS = { a: 0.5, t: 0.5, f: 0.5, d: 0.5, selfLevel: 'mid' };

/* Actualiza el panel visual de estado del estudiante */
function updateStatePanelUI() {
  const aEl = document.getElementById('stateA');
  const dEl = document.getElementById('stateD');
  const lEl = document.getElementById('stateLevel');
  if (!aEl) return;
  aEl.textContent = window.studentS.a.toFixed(2);
  dEl.textContent = window.studentS.d.toFixed(2);
  const tier = getTier(window.studentS);
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
  if (window.activeSession && window.activeSession.topic === topic) return;
  if (window.activeSession) await closeSession(false);

  const uid = sessionStorage.getItem('edu_uid');
  const response = await fetch(`${CONFIG.API_BASE_URL}/api/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      topic,
      mode: window.pilotMode || CONFIG.DEFAULT_MODE,
      S: window.studentS
    })
  });
  if (!response.ok) throw new Error('Error al iniciar sesión');
  const data = await response.json();
  window.activeSession = {
    sessionId: data.session_id,
    topic,
    startTime: Date.now(),
    questions: []
  };
  window.currentTopic = topic;
  return data.first_question;
}

/* Envía respuesta del estudiante */
async function submitAnswer(userAnswer) {
  if (!window.pendingQuestion) return null;
  const responseTimeSec = (Date.now() - window.pendingQuestion.deliveredAt) / 1000;

  const res = await fetch(`${CONFIG.API_BASE_URL}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: window.activeSession.sessionId,
      question_id: window.pendingQuestion.id,
      user_answer: userAnswer,
      response_time: responseTimeSec,
      uid: sessionStorage.getItem('edu_uid')
    })
  });
  const data = await res.json();
  window.studentS = data.S_new;
  updateStatePanelUI();
  persistS();
  return data;
}

async function closeSession(showSummary = true) {
  if (!window.activeSession || window.activeSession.questions.length === 0) {
    window.activeSession = null;
    return null;
  }
  const session = window.activeSession;
  window.activeSession = null;
  window.pendingFeedback = null;

  const res = await fetch(`${CONFIG.API_BASE_URL}/api/session/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: session.sessionId, uid: sessionStorage.getItem('edu_uid') })
  });
  if (!res.ok) return null;
  const metrics = await res.json();
  if (showSummary && metrics) {
    return metrics;
  }
  return null;
}

function persistS() {
  sessionStorage.setItem('edu_S', JSON.stringify(window.studentS));
}

// Exponer funciones en window para uso desde main.js y chat.js
window.updateStatePanelUI = updateStatePanelUI;
window.getTier = getTier;
window.startSession = startSession;
window.submitAnswer = submitAnswer;
window.closeSession = closeSession;
window.persistS = persistS;