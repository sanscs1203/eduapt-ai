// frontend/js/chat.js
// Módulo que gestiona la interfaz de chat del tutor de álgebra.
// Maneja el envío de mensajes, la interacción con la API /api/chat,
// la visualización de recursos, y la integración con el sistema de práctica.

import { CONFIG } from './config.js';

// ============================================================================
// Variables de estado del chat
// ============================================================================

/** Identificador único de la sesión de chat, persistido en localStorage */
let chatSessionId = localStorage.getItem('chatSessionId') || null;

/** Flag para evitar múltiples peticiones simultáneas al backend */
let isWaitingForResponse = false;

// ============================================================================
// Utilidades del DOM
// ============================================================================

/**
 * Obtiene el contenedor de mensajes del chat.
 * Busca por ID o clase, en caso de que el elemento cambie dinámicamente.
 * @returns {HTMLElement|null} Contenedor de mensajes o null si no existe.
 */
function getMessagesContainer() {
    let container = document.getElementById('chatMessages');
    if (!container) container = document.querySelector('.chat-messages');
    return container;
}

/**
 * Desplaza el contenedor de mensajes hacia el final con animación suave.
 * También aplica un fallback con setTimeout para asegurar el scroll tras el render.
 */
function scrollToBottom() {
    const container = getMessagesContainer();
    if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        // Fallback para asegurar que llega al fondo tras la actualización del DOM
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 80);
    }
}

// ============================================================================
// Funciones de formato y visualización de mensajes
// ============================================================================

/**
 * Convierte un código de intención a un texto legible con emoji.
 * @param {string} intent - Código de intención (GREETING, EXPLAIN, ...)
 * @returns {string} Texto formateado para mostrar al usuario.
 */
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

/**
 * Agrega un mensaje al contenedor del chat con formato Markdown básico y links.
 * Esta función se expone globalmente porque es utilizada desde otros scripts.
 *
 * @param {string} content - Texto del mensaje (puede contener **negrita** y [links](url)).
 * @param {string} sender - 'user' o 'bot'.
 * @param {Object} [meta={}] - Metadatos adicionales (intent, topic, confidence).
 */
window.appendMessage = function(content, sender, meta = {}) {
    const container = getMessagesContainer();
    if (!container) return;

    // Crear fila del mensaje
    const row = document.createElement('div');
    row.className = `msg-row ${sender}`;

    // Avatar (vacío, pero podría tener icono)
    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${sender === 'user' ? 'user-av' : 'bot'}`;
    avatar.textContent = '';

    // Burbuja del mensaje
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Convertir **negrita** a <strong>
    let htmlContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convertir [texto](url) a enlaces externos con estilo azul claro y target _blank
    htmlContent = htmlContent.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#60A5FA;">$1</a>'
    );
    // Convertir saltos de línea a <br>
    htmlContent = htmlContent.replace(/\n/g, '<br>');

    bubble.innerHTML = `<div class="msg-text">${htmlContent}</div>`;

    // (Se ha eliminado la badge de depuración NLP como se indica en Bug 2.4)

    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    scrollToBottom();
};

/**
 * Muestra un indicador de escritura (tres puntos animados) en el chat.
 * Evita duplicados comprobando la existencia del elemento por ID.
 */
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

/**
 * Elimina el indicador de escritura del chat.
 */
window.removeTyping = function() {
    const typing = document.getElementById('typingIndicatorRow');
    if (typing) typing.remove();
};

// ============================================================================
// Petición de recursos de estudio (endpoint /api/resources)
// ============================================================================

/**
 * Solicita al backend recursos de estudio para un tema específico.
 * Muestra los resultados en el chat con formato de enlaces.
 * @param {string} topic - Tema (ej. 'polinomios', 'factorizacion')
 */
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
            // Bug 2.3: solo título como link, sin mostrar dificultad
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

// ============================================================================
// Lógica principal de envío de mensajes (handleMessage)
// ============================================================================

/**
 * Maneja el envío de un mensaje del usuario al backend.
 * Evalúa si hay una pregunta pendiente (modo práctica) o envía al chat normal.
 * También maneja timeouts, indicador de escritura y actualización de UI.
 *
 * @param {string} userMessage - Texto ingresado por el usuario.
 */
window.handleMessage = async function(userMessage) {
    // Validaciones iniciales
    if (!userMessage || isWaitingForResponse) return;

    // Deshabilitar input y botón durante el procesamiento
    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    isWaitingForResponse = true;

    // ------------------------------------------------------------
    // Modo práctica: si hay una pregunta pendiente, la respondemos directamente
    // sin pasar por /api/chat (Bug 2.1)
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // Flujo normal de chat: enviamos a /api/chat con NLP + LLM
    // ------------------------------------------------------------
    window.appendMessage(userMessage, 'user');
    if (input) input.value = '';

    window.showTyping();

    // Timeout de 30 segundos para la petición (evita bloqueos eternos)
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

        // Actualizar identificador de sesión si el backend lo devuelve
        if (data.chat_session_id) {
            chatSessionId = data.chat_session_id;
            localStorage.setItem('chatSessionId', chatSessionId);
        }

        window.removeTyping();

        const { reply, confidence } = data;
        let { intent, topic } = data;

        // Mostrar respuesta del bot
        window.appendMessage(reply, 'bot', { intent, topic, confidence });

        // Actualizar el tema actual en la interfaz si es relevante
        if (topic && topic !== 'social' && topic !== 'none') {
            window.currentTopic = topic;
            window.updateStatePanelUI();   // función definida en otro script (probablemente script.js)
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

        // ------------------------------------------------------------
        // Acciones automáticas según la intención detectada por el NLP
        // ------------------------------------------------------------
        const hasTopic = topic && topic !== 'social' && topic !== 'none';

        if (intent === 'PRACTICE' || intent === 'QUIZ') {
            // Si el NLP no detectó un tema, usar el tema actual de la interfaz
            if (!hasTopic && window.currentTopic) {
                topic = window.currentTopic;
            }
            if (topic && topic !== 'social') {
                // Si no hay una sesión de práctica activa, iniciar una
                if (!window.activeSession) {
                    const q = await window.startSession(topic);
                    if (q) {
                        window.pendingQuestion = q;
                        window.pendingQuestion.deliveredAt = Date.now();
                        // Mostrar la pregunta en el chat como opciones múltiples
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
        // Restaurar input y botón siempre
        if (input) input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        if (input) input.focus();
        isWaitingForResponse = false;
    }
};

// ============================================================================
// Reinicio de la sesión de chat
// ============================================================================

/**
 * Resetea la conversación actual llamando al endpoint /api/chat/reset,
 * limpia el almacenamiento local y muestra el mensaje de bienvenida.
 */
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

// ============================================================================
// Utilidad: escape HTML (por si se necesita sanitizar entrada)
// ============================================================================

/**
 * Escapa caracteres especiales de HTML para prevenir XSS.
 * @param {string} str - Texto plano.
 * @returns {string} Texto con entidades HTML.
 */
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================================================
// Inicialización al cargar el DOM
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const container = getMessagesContainer();
    // Si el chat está vacío, mostrar el mensaje de bienvenida
    if (container && container.children.length === 0) {
        window.appendMessage(
            '¡Hola! Soy tu tutor de álgebra. Puedes pedirme **recursos para estudiar** (ej: "no sé nada de factorización") o iniciar una **práctica** con preguntas. Selecciona un tema en la barra lateral o escríbeme.',
            'bot'
        );
    }
});