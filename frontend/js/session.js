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
                S: window.studentS
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
window.submitAnswer = async function(userAnswer, question) {
    const uid = sessionStorage.getItem('edu_uid');
    const sessionId = window.activeSession;

    const resp = await fetch(`${CONFIG.API_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            user_answer: userAnswer,
            question_id: question.id,
            response_time: Math.round((Date.now() - (question.deliveredAt || Date.now())) / 1000),
            uid: uid
        })
    });
    const result = await resp.json();

    window.removeTyping();

    // ── Feedback visual: mostrar ✅/❌ con la respuesta correcta ──
    const isCorrect = result.is_correct;
    const correctAnswer = question.answer;
    const feedbackMsg = isCorrect
        ? `✅ **¡Correcto!** La respuesta es **${correctAnswer}**.`
        : `❌ **Incorrecto.** La respuesta correcta es **${correctAnswer}**.`;
    window.appendMessage(feedbackMsg, 'bot');

    // ── Actualizar dominio inmediatamente ──
    if (result.S_new) {
        window.studentS = result.S_new;
        sessionStorage.setItem('edu_S', JSON.stringify(result.S_new));
        window.updateStatePanelUI();
    }

    if (result.session_complete) {
        window.pendingQuestion = null;
        window.activeSession = null;
        // Pequeño delay para que se vea el feedback antes del prompt
        setTimeout(() => window.showFeedbackPrompt(), 400);
    } else if (result.next_question) {
        window.pendingQuestion = result.next_question;
        window.pendingQuestion.deliveredAt = Date.now();
        window.appendChoiceQuestion(result.next_question);
    } else {
        window.appendMessage('¡Has completado la práctica! 🎉', 'bot');
        window.pendingQuestion = null;
        window.activeSession = null;
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
                window.appendMessage(
                    `📊 Sesión finalizada. Aciertos: ${metrics.correctCount}/${metrics.totalQuestions} (${Math.round(metrics.accuracy * 100)}%)`,
                    'system'
                );
            }
        } catch (error) {
            console.error('Error closing session:', error);
        }
    }
    window.activeSession = null;
    window.currentTopic = null;
    window.pendingQuestion = null;
    window.updateStatePanelUI();
    const uid = sessionStorage.getItem('edu_uid');
    if (uid) localStorage.removeItem(`edu_pending_session_${uid}`);
    const topbar = document.getElementById('topbarSubject');
    if (topbar) topbar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Álgebra`;
};

// --------------------------------------------------------------
// Mostrar pregunta con opciones múltiples (CORREGIDO para usar opciones del JSON)
// --------------------------------------------------------------
window.appendChoiceQuestion = function(question) {
    let options = [];
    
    // Si la pregunta tiene un array de opciones, usarlas directamente
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        options = [...question.options];
        // Mezclar las opciones para que no aparezcan siempre en el mismo orden
        options = shuffle(options);
    } else {
        // Fallback: generar distractores (solo si no hay opciones en el JSON)
        const correct = String(question.answer).trim();
        const distractors = generateDistractors(correct, question.topic, question.type);
        const uniqueDistractors = distractors.filter(d => d !== correct).slice(0, 3);
        options = shuffle([correct, ...uniqueDistractors]);
    }
    
    const container = document.getElementById('chatMessages');
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.innerHTML = `
        <div class="msg-avatar bot"></div>
        <div class="msg-bubble">
            <div class="msg-text"><strong>${question.question}</strong></div>
            <div class="mc-options" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;">
                ${options.map(opt => `
                    <button class="mc-btn"
                        style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;
                               padding:8px 14px;border-radius:8px;cursor:pointer;text-align:left;
                               font-size:0.9rem;transition:background 0.2s;"
                        data-value="${opt.replace(/"/g, '&quot;')}"
                        data-correct="${question.answer.replace(/"/g, '&quot;')}">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>`;
    container.appendChild(row);

    row.querySelectorAll('.mc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chosen = btn.getAttribute('data-value');
            const correctVal = btn.getAttribute('data-correct');

            // ── Feedback visual en los botones ──
            row.querySelectorAll('.mc-btn').forEach(b => {
                b.disabled = true;
                b.style.cursor = 'default';
                b.style.opacity = '0.7';
                if (b.getAttribute('data-value') === correctVal) {
                    // Siempre marcar la correcta en verde
                    b.style.background = '#16a34a';
                    b.style.borderColor = '#16a34a';
                    b.style.opacity = '1';
                }
            });
            if (chosen !== correctVal) {
                // Marcar la elegida en rojo si es incorrecta
                btn.style.background = '#dc2626';
                btn.style.borderColor = '#dc2626';
                btn.style.opacity = '1';
            }

            // Guardar ref a la pregunta ANTES de limpiarla
            const questionSnapshot = window.pendingQuestion;
            window.pendingQuestion = null;

            // Mostrar respuesta del usuario en el chat
            window.appendMessage(chosen, 'user');
            window.showTyping();

            // Pequeño delay para que se vea el color antes de procesar
            setTimeout(() => {
                window.submitAnswer(chosen, questionSnapshot);
            }, 500);
        });
    });

    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 80);
};

// --------------------------------------------------------------
// Prompt de feedback post-ronda (con envío al backend y actualización local)
// --------------------------------------------------------------
window.showFeedbackPrompt = function() {
    const container = document.getElementById('chatMessages');
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.innerHTML = `
        <div class="msg-avatar bot"></div>
        <div class="msg-bubble">
            <div class="msg-text">¡Ronda completada! 🎉 ¿Te fueron de ayuda las preguntas?</div>
            <div class="mc-options" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                <button class="fb-btn" data-value="si"
                    style="background:#16a34a;color:white;border:none;padding:8px 18px;
                           border-radius:8px;cursor:pointer;font-size:0.9rem;">👍 Sí</button>
                <button class="fb-btn" data-value="no"
                    style="background:#dc2626;color:white;border:none;padding:8px 18px;
                           border-radius:8px;cursor:pointer;font-size:0.9rem;">👎 No</button>
            </div>
        </div>`;
    container.appendChild(row);
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 80);

    row.querySelectorAll('.fb-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            row.querySelectorAll('.fb-btn').forEach(b => b.disabled = true);
            const val = btn.getAttribute('data-value');
            const useful = (val === 'si');
            const uid = sessionStorage.getItem('edu_uid');
            const topic = window.currentTopic;
            const sessionId = window.activeSession;

            // Enviar feedback al backend
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: uid,
                        topic: topic,
                        useful: useful,
                        session_id: sessionId
                    })
                });
                const data = await response.json();
                console.log(`Feedback enviado: useful=${useful}, topic=${topic}`);

                // Si el backend devuelve el nuevo S, actualizarlo localmente
                if (data.S) {
                    window.studentS = data.S;
                    sessionStorage.setItem('edu_S', JSON.stringify(data.S));
                    window.updateStatePanelUI();   // Refrescar barra lateral
                    if (typeof window.loadProfile === 'function') {
                        window.loadProfile();      // Recargar perfil (para gráficos)
                    }
                }
            } catch (err) {
                console.error('Error al enviar feedback:', err);
            }

            if (useful) {
                window.appendMessage('¡Genial! Sigue así 💪 Escribe **"practicar"** cuando quieras otra ronda.', 'bot');
            } else {
                window.showDifficultyPrompt();
            }
        });
    });
};

// --------------------------------------------------------------
// Prompt de dificultad si feedback negativo (envía también al backend)
// --------------------------------------------------------------
window.showDifficultyPrompt = function() {
    const container = document.getElementById('chatMessages');
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.innerHTML = `
        <div class="msg-avatar bot"></div>
        <div class="msg-bubble">
            <div class="msg-text">¿Cómo te parecieron las preguntas?</div>
            <div class="mc-options" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                <button class="diff-btn" data-value="facil"
                    style="background:#0284c7;color:white;border:none;padding:8px 18px;
                           border-radius:8px;cursor:pointer;font-size:0.9rem;">😴 Muy fáciles</button>
                <button class="diff-btn" data-value="dificil"
                    style="background:#7c3aed;color:white;border:none;padding:8px 18px;
                           border-radius:8px;cursor:pointer;font-size:0.9rem;">😰 Muy difíciles</button>
            </div>
        </div>`;
    container.appendChild(row);
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 80);

    row.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            row.querySelectorAll('.diff-btn').forEach(b => b.disabled = true);
            const val = btn.getAttribute('data-value');
            const uid = sessionStorage.getItem('edu_uid');
            const topic = window.currentTopic;
            const sessionId = window.activeSession;

            const too_easy = (val === 'facil');
            const too_hard = (val === 'dificil');

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: uid,
                        topic: topic,
                        useful: false,
                        too_easy: too_easy,
                        too_hard: too_hard,
                        session_id: sessionId
                    })
                });
                const data = await response.json();
                console.log(`Feedback enviado: too_easy=${too_easy}, too_hard=${too_hard}`);

                if (data.S) {
                    window.studentS = data.S;
                    sessionStorage.setItem('edu_S', JSON.stringify(data.S));
                    window.updateStatePanelUI();
                    if (typeof window.loadProfile === 'function') window.loadProfile();
                }
            } catch (err) {
                console.error('Error al enviar feedback de dificultad:', err);
            }

            if (too_easy) {
                window.appendMessage('¡Entendido! Subiré el nivel para el próximo intento. 🚀 Escribe **"practicar"** cuando quieras.', 'bot');
            } else {
                window.appendMessage('Sin problema. Te recomiendo repasar estos recursos antes de intentarlo de nuevo:', 'bot');
                if (window.currentTopic) {
                    try {
                        const uid = sessionStorage.getItem('edu_uid');
                        const resp = await fetch(`${CONFIG.API_BASE_URL}/api/resources`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid, topic: window.currentTopic, S: window.studentS })
                        });
                        const data = await resp.json();
                        if (data.resources && data.resources.length > 0) {
                            let msg = '';
                            data.resources.forEach(r => {
                                msg += `• **[${r.title}](${r.url})**`;
                                if (r.description) msg += `  ${r.description}`;
                                msg += '\n';
                            });
                            window.appendMessage(msg, 'bot');
                        }
                    } catch (err) {
                        console.error('Error fetching resources:', err);
                    }
                }
            }
        });
    });
};

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

/**
 * Genera 3 distractores plausibles para una respuesta dada.
 * Para respuestas numéricas: usa variaciones cercanas con sentido.
 * Para respuestas textuales: usa pool por tema.
 */
function generateDistractors(correct, topic, type) {
    const num = parseFloat(correct);
    const isCleanNumber = !isNaN(num) && String(num) === correct.trim();

    // Solo usar distractores numéricos si es Procedural Y la respuesta es número limpio
    if (type === 'Procedural' && isCleanNumber) {
        const candidates = [
            num + 1, num - 1, num * 2, num + 2, num - 2,
            Math.round(num * 1.5)
        ]
        .map(n => String(n))
        .filter(n => n !== correct && parseFloat(n) >= 0);
        return [...new Set(candidates)].slice(0, 3);
    }

    // Conceptual o respuesta textual/algebraica → pool por tema
    const textDistractors = {
        potencias: ['Se multiplican los exponentes', 'Se restan las bases', 'No está definido',
                    'El mismo número', 'La base', 'El exponente', '0', 'Infinito',
                    'Se suman los exponentes', 'Depende de la base'],
        polinomios: ['Trinomio', 'Monomio', 'x^2', '2x', 'El grado', 'El coeficiente principal',
                     'Término independiente', 'Polinomio homogéneo'],
        factorizacion: ['Suma de cuadrados', 'Diferencia de cubos', 'No factoriza',
                        'Factor común', 'Trinomio cuadrado perfecto'],
        ecuaciones: ['No tiene solución', 'Infinitas soluciones', 'x = 0', 'x = 1', 'x = -1'],
        funciones: ['El dominio', 'El rango', 'La pendiente', 'El intercepto', 'No es función'],
        default: ['Ninguna de las anteriores', 'No existe', 'Infinito', 'Cero']
    };

    const pool = textDistractors[topic] || textDistractors.default;
    return shuffle(pool.filter(d => d !== correct)).slice(0, 3);
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

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