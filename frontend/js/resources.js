/* ============================================================
   EduAdapt AI – resources.js
   Panel de recursos recomendados (backend-driven)
   ============================================================ */

import { CONFIG } from './config.js';

/**
 * Carga los recursos recomendados desde el backend para el tema actual.
 * Realiza una petición POST al endpoint `/api/recommend` con los datos de sesión.
 * Renderiza los resultados en el contenedor `resourcesList`.
 */
async function loadRecommendedResources() {
  const container = document.getElementById('resourcesList');
  if (!container) return; // Salir si el contenedor no existe (puede estar en otra página)

  try {
    // Obtener el tema actual (variable global definida en main.js u otro script)
    const currentTopic = window.currentTopic || null;
    const pilotMode = window.pilotMode || CONFIG.DEFAULT_MODE;

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: sessionStorage.getItem('edu_uid'),
        topic: currentTopic,
        mode: pilotMode
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    renderResources(data.resources);
  } catch (error) {
    console.warn('[Resources] Error al cargar recomendaciones:', error.message);
    // Mostrar mensaje amigable en el contenedor si ocurre un error
    if (container) {
      container.innerHTML = '<p class="error">No se pudieron cargar los recursos. Intenta más tarde.</p>';
    }
  }
}

/**
 * Renderiza la lista de recursos en el contenedor.
 * @param {Array<Object>} resources - Lista de recursos (cada uno con title, url, description, type, justification).
 */
function renderResources(resources) {
  const container = document.getElementById('resourcesList');
  
  // Si no hay contenedor o la lista está vacía, mostrar mensaje informativo
  if (!container || !resources?.length) {
    if (container) {
      container.innerHTML = '<p>Selecciona un tema para ver recursos recomendados.</p>';
    }
    return;
  }

  // Generar HTML para cada recurso usando mapeo
  container.innerHTML = resources.map(resource => `
    <div class="resource-card">
      <div class="resource-type">${resource.type || '📄'}</div>
      <h4>${escapeHtml(resource.title)}</h4>
      <p>${escapeHtml(resource.description || '')}</p>
      <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Ver recurso</a>
      <div class="resource-justification">🔍 ${escapeHtml(resource.justification || 'Recomendado según tu perfil de aprendizaje.')}</div>
    </div>
  `).join('');
}

/**
 * Función auxiliar para escapar caracteres HTML y prevenir XSS.
 * @param {string} str - Cadena a escapar.
 * @returns {string} Cadena segura para insertar en el DOM.
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Opcional: exponer la función globalmente si es llamada desde el HTML
// (por ejemplo, cuando cambia el tema desde la barra lateral)
window.loadRecommendedResources = loadRecommendedResources;