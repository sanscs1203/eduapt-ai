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

window.appendMessage = function(content, sender) {
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
    // Permitir enlaces HTML
    bubble.innerHTML = `<div class="msg-text">${escapeHtml(htmlContent)}</div>`;
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

// --- NUEVA FUNCIÓN: solicitar recursos de estudio ---
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
            appendMessage(msg, 'bot');
        } else {
            appendMessage('No encontré recursos para ese tema. Intenta con otro.', 'bot');
        }
    } catch (err) {
        console.error(err);
        appendMessage('Error al buscar recursos. Inténtalo de nuevo.', 'bot');
    }
}

// --- Lógica principal de mensajes ---
window.handleMessage = async function(userMessage) {
    if (!userMessage || isWaitingForResponse) return;
    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    isWaitingForResponse = true;

    window.appendMessage(userMessage, 'user');
    if (input) input.value = '';

    // Detectar intención de estudio (palabras clave)
    const lowerMsg = userMessage.toLowerCase();
    const studyIntents = ['no sé', 'no se', 'estudiar', 'explicar', 'recurso', 'material', 'ayuda', 'no entiendo', 'no tengo idea', 'necesito aprender'];
    const practiceIntents = ['practicar', 'ejercicio', 'test', 'evaluar', 'probar', 'cuestionario', 'pregunta'];

    let intent = 'chat'; // por defecto, pasamos al LLM

    // Primero, si es claramente una petición de práctica, ignoramos estudio
    if (practiceIntents.some(w => lowerMsg.includes(w))) {
        // Iniciar sesión de práctica (se maneja en main.js o session.js, pero aquí podemos delegar)
        // Simplemente enviamos al LLM para que inicie el flujo, o forzamos startSession
        // Como no tenemos acceso directo a startSession, dejamos que el LLM responda algo como "Elige un tema"
        // Pero podemos detectar si hay un tema actual y iniciar práctica directamente.
        if (window.currentTopic) {
            window.removeTyping(); // removemos el typing que se mostrará después
            // Llamamos a startSession (definida en session.js)
            const q = await window.startSession(window.currentTopic);
            if (q) {
                window.appendMessage(`¡Vamos a practicar **${CONFIG.TOPIC_LABELS[window.currentTopic]}**!`, 'bot');
                window.pendingQuestion = q;
                window.pendingQuestion.deliveredAt = Date.now();
                window.appendMessage(`**${q.question}**`, 'bot');
            }
            if (input) input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            isWaitingForResponse = false;
            return;
        } else {
            appendMessage('Primero selecciona un tema de la barra lateral o escribe el nombre del tema.', 'bot');
            if (input) input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            isWaitingForResponse = false;
            return;
        }
    } else if (studyIntents.some(w => lowerMsg.includes(w))) {
        // Intentar extraer un tema del mensaje o usar el tema actual
        let topic = window.currentTopic;
        if (!topic) {
            // Buscar tema en el mensaje
            for (const t of CONFIG.TOPICS) {
                if (lowerMsg.includes(t) || lowerMsg.includes(CONFIG.TOPIC_LABELS[t].toLowerCase())) {
                    topic = t;
                    break;
                }
            }
        }
        if (topic) {
            window.showTyping();
            await requestStudyResources(topic);
            window.removeTyping();
            if (input) input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            isWaitingForResponse = false;
            return;
        } else {
            appendMessage('¿Sobre qué tema necesitas ayuda? Puedes decirme, por ejemplo, "no sé nada de factorización".', 'bot');
            if (input) input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            isWaitingForResponse = false;
            return;
        }
    }

    // Si no es estudio ni práctica, usar el LLM normal
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
        window.appendMessage(data.reply, 'bot');
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