/* ============================================================
   EduAdapt AI – utils.js
   Funciones de utilidad general
   ============================================================ */

function formatTime() {
  return new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit'
  });
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : 'E';
}

function renderText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--blue);text-decoration:underline;">$1</a>');
}

function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// Función para esperar a que Firebase esté listo
function onFirebaseReady(callback) {
  if (window.firebaseReady) callback();
  else window.addEventListener(CONFIG.FIREBASE_READY_EVENT, callback, { once: true });
}