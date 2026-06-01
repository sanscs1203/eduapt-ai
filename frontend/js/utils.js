// frontend/js/utils.js
// Utilidades generales para el frontend: obtención de iniciales,
// formateo de tiempo, toasts, renderizado de markdown básico y control de área de chat.

// ============================================================================
// 1. Obtención de iniciales a partir de un nombre
// ============================================================================

/**
 * Obtiene las iniciales de un nombre completo.
 * - Si el nombre tiene una sola palabra, retorna la primera letra en mayúscula.
 * - Si tiene dos o más palabras, retorna la primera letra de la primera y de la última palabra.
 * 
 * @param {string} name - Nombre completo (ej. "Juan Pérez").
 * @returns {string} Iniciales (ej. "JP") o "?" si el nombre está vacío.
 */
window.getInitial = function(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============================================================================
// 2. Formateo de tiempo (segundos → mm:ss)
// ============================================================================

/**
 * Convierte una cantidad de segundos en un formato legible mm:ss.
 * 
 * @param {number} seconds - Segundos (puede ser decimal).
 * @returns {string} Tiempo formateado (ej. "3:45").
 */
window.formatTime = function(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============================================================================
// 3. Notificaciones tipo toast (mensajes temporales)
// ============================================================================

/**
 * Muestra un mensaje emergente (toast) en la esquina inferior derecha.
 * El mensaje desaparece automáticamente después de 3 segundos.
 * 
 * @param {string} message - Texto del mensaje.
 * @param {string} [type='info'] - Tipo de mensaje: 'info', 'success' o 'error'.
 */
window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    // Estilos inline para asegurar visibilidad independientemente del CSS global
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = type === 'error' ? '#dc2626' : (type === 'success' ? '#10b981' : '#3b82f6');
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// ============================================================================
// 4. Renderizado de texto con markdown básico (negritas)
// ============================================================================

/**
 * Convierte texto con formato **negrita** a HTML <strong>.
 * 
 * @param {string} text - Texto que puede contener **texto en negrita**.
 * @returns {string} Texto transformado con etiquetas HTML.
 */
window.renderText = function(text) {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

// ============================================================================
// 5. Control del área de chat y pantalla de bienvenida
// ============================================================================

/**
 * Muestra el área de mensajes (chat) y oculta la pantalla de bienvenida.
 * Actualiza la variable global `window.chatVisible` a `true`.
 */
window.showChatArea = function() {
    const welcome = document.getElementById('welcomeScreen');
    if (welcome) welcome.style.display = 'none';
    const messagesWrap = document.getElementById('messagesWrap');
    if (messagesWrap) messagesWrap.style.display = 'flex';
    window.chatVisible = true;
};