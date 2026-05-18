import { CONFIG } from './config.js';

// Abrir perfil
window.openProfile = async function() {
  const uid = sessionStorage.getItem('edu_uid');
  if (!uid) return;

  try {
    const resp = await fetch(`${CONFIG.API_BASE_URL}/api/profile/${uid}`);
    const profile = await resp.json();
    buildProfileUI(profile);
    document.getElementById('profileOverlay').classList.add('open');
  } catch (e) {
    console.error(e);
    window.showToast('Error al cargar el perfil', 'error');
  }
};

function buildProfileUI(data) {
  const container = document.getElementById('profileContent');
  let html = '';

  // Nombre
  html += `<div class="profile-section">
    <h3>👤 Nombre</h3>
    <p style="font-size:1.1rem;">${data.name}</p>
  </div>`;

  // Preferencias
  html += `<div class="profile-section">
    <h3>🎯 Preferencias de recursos</h3>
    <div class="badge-list">${data.preferences.map(p => `<span>${p}</span>`).join('') || '<span>Ninguna</span>'}</div>
  </div>`;

  // Ruta crítica
  html += `<div class="profile-section">
    <h3>⚠️ Ruta crítica (temas a reforzar)</h3>
    ${data.critical_path.map(t => `<div class="critical-item">• ${CONFIG.TOPIC_LABELS[t.topic] || t.topic}: ${Math.round(t.mastery*100)}%</div>`).join('') || '<p>No hay datos</p>'}
  </div>`;

  // Número de sesiones
  html += `<div class="profile-section">
    <h3>📈 Sesiones completadas</h3>
    <p style="font-size:1.5rem;font-weight:600;">${data.total_sessions}</p>
  </div>`;

  // Barras de dominio por tema
  html += `<div class="profile-section">
    <h3>📊 Dominio por tema</h3>
    ${Object.entries(data.topic_mastery).map(([topic, mastery]) => {
      const pct = Math.round(mastery * 100);
      return `<div class="mastery-bar">
        <span class="label">${CONFIG.TOPIC_LABELS[topic] || topic}</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="value">${pct}%</span>
      </div>`;
    }).join('') || '<p>Sin datos</p>'}
  </div>`;

  // Gráfico de evolución
  html += `<div class="profile-section">
    <h3>📈 Evolución del dominio global</h3>
    <canvas id="masteryChart"></canvas>
  </div>`;

  container.innerHTML = html;

  // Dibujar gráfico
  renderMasteryChart(data.mastery_history);
}

let chartInstance = null;
function renderMasteryChart(history) {
  const ctx = document.getElementById('masteryChart')?.getContext('2d');
  if (!ctx) return;

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
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Dominio: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

// Cerrar perfil
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

function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
}