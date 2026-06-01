// frontend/js/profile.js
// Módulo que gestiona la visualización del perfil del estudiante.
// Muestra información como nombre, preferencias, ruta crítica (temas con menor dominio)
// y el nivel de dominio (mastery) por cada tema del álgebra.

import { CONFIG } from './config.js';

// ============================================================================
// Variables globales del módulo (referencias a elementos del DOM)
// ============================================================================
let profileOverlay = null;   // Overlay del modal de perfil
let profileContent = null;   // Contenedor donde se renderiza el contenido del perfil

// ============================================================================
// Inicialización al cargar el DOM
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Obtener referencias a los elementos del DOM
  profileOverlay = document.getElementById('profileOverlay');
  profileContent = document.getElementById('profileContent');

  const profileBtn = document.getElementById('profileBtn');
  const profileClose = document.getElementById('profileClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // --------------------------------------------------------------------------
  // Botón para abrir el perfil (desde la barra lateral)
  // --------------------------------------------------------------------------
  if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evitar que el evento se propague al overlay del sidebar
      loadProfile();       // Cargar datos del perfil desde el backend
      if (profileOverlay) profileOverlay.classList.add('active');
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
    });
  }

  // --------------------------------------------------------------------------
  // Botón para cerrar el perfil (X)
  // --------------------------------------------------------------------------
  if (profileClose) {
    profileClose.addEventListener('click', () => {
      if (profileOverlay) profileOverlay.classList.remove('active');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    });
  }

  // --------------------------------------------------------------------------
  // Cerrar el perfil si se hace clic en el fondo (overlay del sidebar)
  // --------------------------------------------------------------------------
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (profileOverlay) profileOverlay.classList.remove('active');
    });
  }
});

// ============================================================================
// Función global para cargar el perfil desde el backend
// Se expone globalmente porque es llamada desde main.js al hacer clic en userCard
// ============================================================================

/**
 * Carga el perfil del estudiante desde la API y lo renderiza en el modal.
 * Obtiene el UID de la sesión y realiza una petición GET a /api/profile/{uid}.
 * @returns {Promise<void>} No retorna valor, pero actualiza el DOM.
 */
window.loadProfile = async function () {
  const uid = sessionStorage.getItem('edu_uid');
  if (!uid) return; // Si no hay UID, no hay perfil que cargar

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/profile/${uid}`);
    if (!response.ok) throw new Error('Error al cargar perfil');
    const profile = await response.json();
    renderProfile(profile);
  } catch (error) {
    console.error('[profile.js] Error al cargar perfil:', error);
    if (profileContent) {
      profileContent.innerHTML = '<p class="error">No se pudo cargar el perfil.</p>';
    }
  }
};

// ============================================================================
// Renderizado del perfil en el contenedor (HTML dinámico)
// ============================================================================

/**
 * Renderiza el contenido del perfil a partir de los datos recibidos.
 * Muestra:
 * - Nombre del estudiante y preferencias de estudio.
 * - Ruta crítica (temas con menor dominio, ordenados ascendentemente).
 * - Barra de progreso por cada tema (mastery).
 *
 * @param {Object} profile - Objeto con la estructura devuelta por /api/profile/{uid}.
 * @param {string} profile.name - Nombre completo del estudiante.
 * @param {string[]} profile.preferences - Lista de preferencias (ej. 'video', 'text').
 * @param {Array<{topic: string, mastery: number}>} profile.critical_path - Lista de temas prioritarios (menor mastery).
 * @param {Object.<string, number>} profile.topic_mastery - Mapa de tema -> mastery (0..1).
 */
function renderProfile(profile) {
  if (!profileContent) return;

  const { name, preferences, critical_path, topic_mastery } = profile;

  let html = `
    <div class="profile-section">
      <h3>👤 Estudiante</h3>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Preferencias de estudio:</strong> ${preferences.length ? preferences.join(', ') : 'No especificadas'}</p>
    </div>

    <div class="profile-section">
      <h3>🎯 Ruta crítica</h3>
      <p>Temas con menor dominio (prioritarios):</p>
      <ul class="critical-list">
  `;

  if (critical_path && critical_path.length) {
    critical_path.forEach(item => {
      const masteryPercent = Math.round(item.mastery * 100);
      html += `<li><strong>${CONFIG.TOPIC_LABELS[item.topic] || item.topic}</strong> — Dominio: ${masteryPercent}%</li>`;
    });
  } else {
    html += `<li>Completa algunas prácticas para ver tu ruta crítica.</li>`;
  }
  html += `</ul></div>`;

  // Sección de dominio por tema (barras de progreso)
  html += `<div class="profile-section"><h3>📊 Dominio por tema</h3><div class="topic-mastery-list">`;

  for (const [topicKey, mastery] of Object.entries(topic_mastery)) {
    const percent = Math.round(mastery * 100);
    const label = CONFIG.TOPIC_LABELS[topicKey] || topicKey;
    html += `
      <div class="topic-mastery-item">
        <span class="topic-name">${escapeHtml(label)}</span>
        <div class="mastery-bar-bg">
          <div class="mastery-bar-fill" style="width: ${percent}%; background: ${getMasteryColor(mastery)};"></div>
        </div>
        <span class="mastery-percent">${percent}%</span>
      </div>
    `;
  }
  html += `</div></div>`;

  profileContent.innerHTML = html;
}

// ============================================================================
// Utilidades auxiliares
// ============================================================================

/**
 * Determina el color de la barra de progreso según el nivel de dominio.
 * @param {number} mastery - Valor entre 0 y 1.
 * @returns {string} Código de color en formato hexadecimal o nombre CSS.
 */
function getMasteryColor(mastery) {
  if (mastery < 0.45) return '#ef4444'; // Rojo (bajo)
  if (mastery < 0.85) return '#f59e0b'; // Naranja (medio)
  return '#10b981';                     // Verde (alto)
}

/**
 * Escapa caracteres especiales de HTML para prevenir inyección de código (XSS).
 * @param {string} str - Cadena de texto a escapar.
 * @returns {string} Cadena segura para insertar en el DOM.
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}