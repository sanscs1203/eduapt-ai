// frontend/js/chat.js
import { CONFIG } from './config.js';

let chatSessionId = localStorage.getItem('chatSessionId') || null;
let isWaitingForResponse = false;

function getMessagesContainer() {
    let container = document.getElementById('chatMessages');
    if (!container) container = document.querySelector('.chat-messages');
    return container;
}

function scrollToBottom() {
    const container = getMessagesContainer();
    if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
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

// --- Versión mejorada de appendMessage que recibe metadatos NLP ---
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

    let htmlContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlContent = htmlContent.replace(/\n/g, '<br>');
    bubble.innerHTML = `<div class="msg-text">${escapeHtml(htmlContent)}</div>`;

    // Añadir badge NLP si es un mensaje del bot y hay metadatos
    if (sender === 'bot' && meta.intent && meta.intent !== 'AMBIGUOUS') {
        const badge = document.createElement('div');
        badge.className = 'nlp-badge';
        let badgeText = '';
        if (meta.topic && meta.topic !== 'social' && meta.topic !== 'none') {
            badgeText = `${formatIntent(meta.intent)} · ${meta.topic}`;
        } else {
            badgeText = formatIntent(meta.intent);
        }
        badge.textContent = badgeText;
        badge.title = `Confianza: ${Math.round((meta.confidence || 0) * 100)}%`;
        bubble.appendChild(badge);
    }

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

// --- Lógica principal de mensajes (ahora usando NLP del backend) ---
window.handleMessage = async function(userMessage) {
    if (!userMessage || isWaitingForResponse) return;

    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    isWaitingForResponse = true;

    // Mostrar el mensaje del usuario
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
                topic: window.currentTopic || 'polinomios',   // tópico actual si existe
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

        const { reply, intent, topic, confidence } = data;

        // Mostrar la respuesta con los metadatos NLP
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

        // --- Acciones automáticas según intención y tópico ---
        const hasTopic = topic && topic !== 'social' && topic !== 'none';
        if (intent === 'PRACTICE') {
            if (!hasTopic && window.currentTopic) {
                // Si el usuario no mencionó tema, usar el tópico actual
                topic = window.currentTopic;
            }
            if (topic && topic !== 'social') {
                if (!window.activeSession) {
                const q = await window.startSession(topic);
                if (q) {
                    window.appendMessage(`¡De acuerdo! Comenzamos práctica de **${CONFIG.TOPIC_LABELS[topic]}**.`, 'bot');
                    window.pendingQuestion = q;
                    window.pendingQuestion.deliveredAt = Date.now();
                    window.appendMessage(`**${q.question}**`, 'bot');
                }
                }
            }
        } else if ((intent === 'EXPLAIN' || intent === 'DOUBT') && hasTopic) {
        // Ofrecer recursos si el usuario pide explicación sobre un tema concreto
        await requestStudyResources(topic);
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

// --- La función requestStudyResources se mantiene por si se necesita desde otros lugares ---
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
            let msg = `📚 **Recursos para estudiar ${CONFIG.TOPIC_LABELS[topic] || topic}**\n\n*Según tu nivel actual y preferencias:*\n`;
            data.resources.forEach(r => {
                msg += `- [${r.title} (${r.difficulty})](${r.url})  \n  _${r.description || ''}_\n`;
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
        window.appendMessage('Soy tu tutor de álgebra. Puedo recomendarte material de estudio o iniciar una práctica. ¿En qué te ayudo?', 'bot');
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
        window.appendMessage('¡Hola! Soy tu tutor de álgebra. Puedes pedirme **recursos para estudiar** (ej: "no sé nada de factorización") o iniciar una **práctica** con preguntas. Selecciona un tema en la barra lateral o escríbeme.', 'bot');
    }
});