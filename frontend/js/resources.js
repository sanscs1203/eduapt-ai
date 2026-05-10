/* ============================================================
   EduAdapt AI – resources.js
   Panel de recursos recomendados (backend-driven)
   ============================================================ */

async function loadRecommendedResources() {
  const container = document.getElementById('resourcesList');
  if (!container) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: sessionStorage.getItem('edu_uid'),
        topic: currentTopic,
        mode: pilotMode
      })
    });
    const data = await res.json();
    renderResources(data.resources);
  } catch (e) {
    console.warn('[Resources] Error al cargar recomendaciones:', e.message);
  }
}

function renderResources(resources) {
  const container = document.getElementById('resourcesList');
  if (!container || !resources?.length) {
    if (container) container.innerHTML = '<p>Selecciona un tema para ver recursos recomendados.</p>';
    return;
  }

  container.innerHTML = resources.map(r => `
    <div class="resource-card">
      <div class="resource-type">${r.type || '📄'}</div>
      <h4>${r.title}</h4>
      <p>${r.description || ''}</p>
      <a href="${r.url}" target="_blank" rel="noopener noreferrer">Ver recurso</a>
      <div class="resource-justification">🔍 ${r.justification || 'Recomendado según tu perfil de aprendizaje.'}</div>
    </div>
  `).join('');
}