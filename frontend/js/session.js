// frontend/js/session.js
import { CONFIG } from './config.js';

// Variables globales
window.activeSession = null;
window.currentTopic = null;
window.pendingQuestion = null;
window.studentS = null;

// --------------------------------------------------------------
// Iniciar una sesión de ejercicios
// --------------------------------------------------------------
window.startSession = async function(topic) {
    if (window.activeSession) await window.closeSession(true);
    const uid = sessionStorage.getItem('edu_uid');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: uid,
                topic: topic,
                mode: window.pilotMode || 'adaptive',
                S: window.studentS // Aquí enviamos el nuevo vector multitema al Python
            })
        });
        const data = await response.json();
        window.activeSession = data.session_id;
        window.currentTopic = topic;
        if (uid) {
            localStorage.setItem(`edu_pending_session_${uid}`, JSON.stringify({ sessionId: data.session_id }));
        }
        const topbarSubject = document.getElementById('topbarSubject');
        if (topbarSubject) {
            topbarSubject.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> ${CONFIG.TOPIC_LABELS[topic] || topic}`;
        }
        return data.first_question;
    } catch (error) {
        console.error('Error starting session:', error);
        window.appendMessage('No se pudo iniciar la sesión.', 'bot');
        return null;
    }
};

// --------------------------------------------------------------
// Enviar respuesta
// --------------------------------------------------------------
window.submitAnswer = async function(userAnswer, questionId, responseTimeSec) {
    if (!window.activeSession) return null;
    const uid = sessionStorage.getItem('edu_uid');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: window.activeSession,
                user_answer: userAnswer,
                question_id: questionId,
                response_time: responseTimeSec,
                uid: uid
            })
        });
        const data = await response.json();
        window.studentS = data.S_new;
        sessionStorage.setItem('edu_S', JSON.stringify(window.studentS));
        window.updateStatePanelUI();
        window.appendMessage(data.explanation, 'bot');
        if (data.resource && data.resource.url && data.resource.url !== '#') {
            window.appendMessage(`📚 Recurso: <a href="${data.resource.url}" target="_blank">${data.resource.title}</a>`, 'bot');
        }
        if (data.next_question) {
            window.pendingQuestion = data.next_question;
            window.pendingQuestion.deliveredAt = Date.now();
            window.appendMessage(`**${data.next_question.question}**`, 'bot');
        } else {
            await window.closeSession(true);
            window.appendMessage('¡Has completado todos los ejercicios! 🎉', 'bot');
        }
        return data;
    } catch (error) {
        console.error('Error submitting answer:', error);
        window.appendMessage('Error al evaluar tu respuesta.', 'bot');
        return null;
    }
};

// --------------------------------------------------------------
// Cerrar sesión
// --------------------------------------------------------------
window.closeSession = async function(saveMetrics = true) {
    if (!window.activeSession) return;
    if (saveMetrics) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/session/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: window.activeSession })
            });
            const metrics = await response.json();
            if (metrics && metrics.totalQuestions > 0) {
                window.appendMessage(`📊 Sesión finalizada. Aciertos: ${metrics.correctCount}/${metrics.totalQuestions} (${Math.round(metrics.accuracy*100)}%)`, 'system');
            }
        } catch (error) {
            console.error('Error closing session:', error);
        }
    }
    window.activeSession = null;
    window.currentTopic = null;
    window.pendingQuestion = null;
    const uid = sessionStorage.getItem('edu_uid');
    if (uid) localStorage.removeItem(`edu_pending_session_${uid}`);
    document.getElementById('topbarSubject').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Álgebra`;
};

// --------------------------------------------------------------
// Actualizar UI del estado
// --------------------------------------------------------------
window.updateStatePanelUI = function() {
    const s = window.studentS;
    if (!s || !s.a_temas) return;

    const stateA = document.getElementById('stateA');
    const stateD = document.getElementById('stateD');
    const stateLevel = document.getElementById('stateLevel');

    // 1. Calculamos el promedio de maestría de todos los temas para el "Progreso Total"
    const temas = Object.values(s.a_temas);
    const avgMastery = temas.reduce((acc, t) => acc + t.mastery, 0) / temas.length;

    if (stateA) stateA.textContent = `${(avgMastery * 100).toFixed(0)}%`;
    
    // 2. d_global ahora está en la raíz de S
    if (stateD && s.d_global) stateD.textContent = `${s.d_global.toFixed(2)}`;

    // 3. Nivel visual basado en el promedio
    if (stateLevel) {
        const tier = avgMastery >= 0.85 ? 'Experto' : (avgMastery >= 0.6 ? 'Intermedio' : 'Iniciado');
        stateLevel.textContent = tier;
    }
};

// --------------------------------------------------------------
// Recuperar sesión pendiente (exportada)
// --------------------------------------------------------------
export async function recoverPendingSession() {
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid) return;
    const pendingKey = `edu_pending_session_${uid}`;
    const raw = localStorage.getItem(pendingKey);
    if (!raw) return;
    localStorage.removeItem(pendingKey);
    try {
        const { sessionId } = JSON.parse(raw);
        window.activeSession = sessionId;
        console.log('Sesión pendiente encontrada:', sessionId);
    } catch (_) {}
}