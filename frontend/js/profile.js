// frontend/js/profile.js
import { CONFIG } from './config.js';

// --------------------------------------------------------------
// Abrir el panel de perfil
// --------------------------------------------------------------
window.openProfile = async function() {
  const uid = sessionStorage.getItem('edu_uid');
  if (!uid) {
    window.showToast('No has iniciado sesión.', 'error');
    return;
  }

  try {
    const resp = await fetch(`${CONFIG.API_BASE_URL}/api/profile/${uid}`);
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({ error: 'Error desconocido' }));
      window.showToast(`Error: ${errData.error || resp.statusText}`, 'error');
      return;
    }
    const profile = await resp.json();
    buildProfileUI(profile);
    document.getElementById('profileOverlay').classList.add('open');
  } catch (e) {
    console.error(e);
    window.showToast('Error de conexión al cargar el perfil.', 'error');
  }
};

// --------------------------------------------------------------
// Construir la interfaz del perfil
// --------------------------------------------------------------
function buildProfileUI(data) {
  const container = document.getElementById('profileContent');
  if (!container) return;

  // Valores por defecto para evitar errores si falta algún campo
  const name = data.name || 'Estudiante';
  const preferences = data.preferences || [];
  const criticalPath = data.critical_path || [];
  const totalSessions = data.total_sessions || 0;
  const topicMastery = data.topic_mastery || {};
  const masteryHistory = data.mastery_history || [];

  let html = '';

  // --- Nombre ---
  html += `<div class="profile-section">
    <h3>👤 Nombre</h3>
    <p style="font-size:1.1rem;font-weight:500;">${escapeHtml(name)}</p>
  </div>`;

  // --- Preferencias ---
  html += `<div class="profile-section">
    <h3>🎯 Preferencias de recursos</h3>
    <div class="badge-list">
      ${preferences.length > 0
        ? preferences.map(p => `<span>${escapeHtml(p)}</span>`).join('')
        : '<span style="color:var(--text-muted);">Ninguna</span>'}
    </div>
  </div>`;

  // --- Ruta crítica ---
  html += `<div class="profile-section">
    <h3>⚠️ Ruta crítica (temas a reforzar)</h3>
    ${criticalPath.length > 0
      ? criticalPath.map(t => `
          <div class="critical-item">
            • ${CONFIG.TOPIC_LABELS[t.topic] || t.topic}: ${Math.round(t.mastery * 100)}%
          </div>`).join('')
      : '<p style="color:var(--text-muted);">No hay datos todavía</p>'}
  </div>`;

  // --- Número de sesiones ---
  html += `<div class="profile-section">
    <h3>📈 Sesiones completadas</h3>
    <p style="font-size:1.5rem;font-weight:600;">${totalSessions}</p>
  </div>`;

  // --- Barras de dominio por tema ---
  html += `<div class="profile-section">
    <h3>📊 Dominio por tema</h3>
    ${Object.keys(topicMastery).length > 0
      ? Object.entries(topicMastery).map(([topic, mastery]) => {
          const pct = Math.round(mastery * 100);
          return `<div class="mastery-bar">
            <span class="label">${CONFIG.TOPIC_LABELS[topic] || topic}</span>
            <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
            <span class="value">${pct}%</span>
          </div>`;
        }).join('')
      : '<p style="color:var(--text-muted);">Sin datos de dominio</p>'}
  </div>`;

  // --- Gráfico de evolución ---
  html += `<div class="profile-section">
    <h3>📈 Evolución del dominio global</h3>
    <canvas id="masteryChart" style="max-height:250px;"></canvas>
    ${masteryHistory.length === 0 ? '<p style="color:var(--text-muted); margin-top:8px;">Completa sesiones para ver tu evolución</p>' : ''}
  </div>`;

  container.innerHTML = html;

  // Dibujar gráfico si hay datos
  if (masteryHistory.length > 0) {
    renderMasteryChart(masteryHistory);
  }
}

// --------------------------------------------------------------
// Gráfico de evolución (Chart.js)
// --------------------------------------------------------------
let chartInstance = null;

function renderMasteryChart(history) {
  const canvas = document.getElementById('masteryChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const labels = history.map((_, i) => i + 1); // números de sesión
  const data = history.map(h => h.global_mastery * 100);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Dominio global (%)',
        data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#3B82F6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `Dominio: ${ctx.raw.toFixed(1)}%`
          }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: '% Dominio' }
        },
        x: {
          title: { display: true, text: 'Sesión' }
        }
      }
    }
  });
}

// --------------------------------------------------------------
// Cerrar el panel de perfil
// --------------------------------------------------------------
function closeProfile() {
  document.getElementById('profileOverlay')?.classList.remove('open');
}

// Eventos de cierre
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('profileOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProfile();
    });
  }
  const closeBtn = document.getElementById('profileClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProfile);
  }
});

// --------------------------------------------------------------
// Función auxiliar para escapar HTML
// --------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}