// frontend/js/chat.js
import { CONFIG } from './config.js';

let chatSessionId = localStorage.getItem('chatSessionId') || null;
let isWaitingForResponse = false;

function getMessagesContainer() {
    let container = document.getElementById('chatMessages');
    if (!container) container = document.querySelector('.chat-messages');
    return container;
}

// Bug 2.7 — Auto-scroll con smooth + fallback inmediato
function scrollToBottom() {
    const container = getMessagesContainer();
    if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        // Fallback para asegurar que llega al fondo tras render
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 80);
    }
}

// --- Función para formatear intención a texto legible ---
function formatIntent(intent) {
    const labels = {
        GREETING: '👋 Saludo',
        EXPLAIN: '📘 Explicación',
        PRACTICE: '📝 Práctica',
        DOUBT: '❓ Duda',
        QUIZ: '🧠 Quiz',
        ABOUT: 'ℹ️ Info',
        CASUAL: '💬 Charla',
        THANKS: '🙏 Agradecimiento',
        GOODBYE: '👋 Despedida',
        UNKNOWN: '❓ Otra',
        AMBIGUOUS: '⚠️ Ambiguo'
    };
    return labels[intent] || intent;
}

// --- appendMessage: sin nlp-badge, con markdown + links, auto-scroll ---
window.appendMessage = function(content, sender, meta = {}) {
    const container = getMessagesContainer();
    if (!container) return;

    const row = document.createElement('div');
    row.className = `msg-row ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${sender === 'user' ? 'user-av' : 'bot'}`;
    avatar.textContent = '';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Convertir markdown básico a HTML seguro
    let htmlContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bug 2.3 — Links en color azul claro, abren en nueva pestaña, sin mostrar dificultad
    htmlContent = htmlContent.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#60A5FA;">$1</a>'
    );
    htmlContent = htmlContent.replace(/\n/g, '<br>');

    bubble.innerHTML = `<div class="msg-text">${htmlContent}</div>`;

    // Bug 2.4 — ELIMINADO: bloque nlp-badge que generaba badges de depuración

    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    scrollToBottom();
};

window.showTyping = function() {
    const container = getMessagesContainer();
    if (!container || document.getElementById('typingIndicatorRow')) return;
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.id = 'typingIndicatorRow';
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar bot';
    avatar.textContent = '';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = `<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    scrollToBottom();
};

window.removeTyping = function() {
    const typing = document.getElementById('typingIndicatorRow');
    if (typing) typing.remove();
};

// --- Lógica principal de mensajes ---
window.handleMessage = async function(userMessage) {

    if (!userMessage || isWaitingForResponse) return;

    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    isWaitingForResponse = true;

    // Bug 2.1 — Si hay pregunta pendiente, evaluar directamente sin pasar por /api/chat
    if (window.pendingQuestion) {
        window.appendMessage(userMessage, 'user');
        if (input) input.value = '';
        window.showTyping();
        try {
            await window.submitAnswer(userMessage, window.pendingQuestion);
        } finally {
            if (input) input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            if (input) input.focus();
            isWaitingForResponse = false;
        }
        return;
    }

    // Flujo normal de chat (NLP + LLM)
    window.appendMessage(userMessage, 'user');
    if (input) input.value = '';

    window.showTyping();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                message: userMessage,
                uid: sessionStorage.getItem('edu_uid') || null,
                topic: window.currentTopic || 'polinomios',
                S: window.studentS || null,
                chat_session_id: chatSessionId
            })
        });
        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.chat_session_id) {
            chatSessionId = data.chat_session_id;
            localStorage.setItem('chatSessionId', chatSessionId);
        }

        window.removeTyping();

        // Bug Fix — topic e intent como let para poder reasignar
        const { reply, confidence } = data;
        let { intent, topic } = data;

        window.appendMessage(reply, 'bot', { intent, topic, confidence });

        // Actualizar tópico en la UI si es relevante
        if (topic && topic !== 'social' && topic !== 'none') {
            window.currentTopic = topic;
            window.updateStatePanelUI();
            const topbar = document.getElementById('topbarSubject');
            if (topbar) {
                topbar.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  ${CONFIG.TOPIC_LABELS[topic] || topic}`;
            }
        }

        // Acciones automáticas según intención
        const hasTopic = topic && topic !== 'social' && topic !== 'none';

        if (intent === 'PRACTICE' || intent === 'QUIZ') {
            // Usar topic activo si el NLP no detectó uno claro
            if (!hasTopic && window.currentTopic) {
                topic = window.currentTopic;
            }
            if (topic && topic !== 'social') {
                if (!window.activeSession) {
                    const q = await window.startSession(topic);
                    if (q) {
                        window.pendingQuestion = q;
                        window.pendingQuestion.deliveredAt = Date.now();
                        window.appendChoiceQuestion(q);
                    }
                }
            }
        }

    } catch (error) {
        clearTimeout(timeoutId);
        window.removeTyping();
        if (error.name === 'AbortError') {
            window.appendMessage('⏱️ El servidor tardó demasiado. Inténtalo de nuevo.', 'bot');
        } else {
            console.error(error);
            window.appendMessage('❌ Error de conexión con el servidor.', 'bot');
        }
    } finally {
        if (input) input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        if (input) input.focus();
        isWaitingForResponse = false;
    }
};

// --- Buscar y mostrar recursos de estudio ---
async function requestStudyResources(topic) {
    const uid = sessionStorage.getItem('edu_uid');
    const S = window.studentS;
    try {
        const resp = await fetch(`${CONFIG.API_BASE_URL}/api/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, topic, S })
        });
        const data = await resp.json();
        if (data.resources && data.resources.length > 0) {
            let msg = `📚 **Recursos para estudiar ${CONFIG.TOPIC_LABELS[topic] || topic}**\n\n`;
            // Bug 2.3 — Solo título como link, sin mostrar dificultad
            data.resources.forEach(r => {
                msg += `• **[${r.title}](${r.url})**`;
                if (r.description) msg += `  ${r.description}`;
                msg += '\n';
            });
            msg += '\nCuando te sientas preparado, escribe **"practicar"** para iniciar un test.';
            window.appendMessage(msg, 'bot');
        } else {
            window.appendMessage('No encontré recursos para ese tema. Intenta con otro.', 'bot');
        }
    } catch (err) {
        console.error(err);
        window.appendMessage('Error al buscar recursos. Inténtalo de nuevo.', 'bot');
    }
}

window.resetChatSession = async function() {
    if (!chatSessionId) return;
    try {
        await fetch(`${CONFIG.API_BASE_URL}/api/chat/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_session_id: chatSessionId })
        });
        chatSessionId = null;
        localStorage.removeItem('chatSessionId');
        const container = getMessagesContainer();
        if (container) container.innerHTML = '';
        window.appendMessage(
            '¡Hola! Soy tu tutor de álgebra. Puedes pedirme **recursos para estudiar** (ej: "no sé nada de factorización") o iniciar una **práctica** con preguntas. Selecciona un tema en la barra lateral o escríbeme.',
            'bot'
        );
    } catch (error) {
        console.error(error);
    }
};

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const container = getMessagesContainer();
    if (container && container.children.length === 0) {
        window.appendMessage(
            '¡Hola! Soy tu tutor de álgebra. Puedes pedirme **recursos para estudiar** (ej: "no sé nada de factorización") o iniciar una **práctica** con preguntas. Selecciona un tema en la barra lateral o escríbeme.',
            'bot'
        );
    }
});