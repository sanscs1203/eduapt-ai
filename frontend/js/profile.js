// frontend/js/profile.js
import { CONFIG } from './config.js';

// Referencias al DOM
let profileOverlay = null;
let profileContent = null;
let profileChart = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    profileOverlay = document.getElementById('profileOverlay');
    profileContent = document.getElementById('profileContent');
    
    // Botones para abrir/cerrar perfil
    const profileBtn = document.getElementById('profileBtn');
    const profileClose = document.getElementById('profileClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            loadProfile();
            if (profileOverlay) profileOverlay.classList.add('active');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
        });
    }
    if (profileClose) {
        profileClose.addEventListener('click', () => {
            if (profileOverlay) profileOverlay.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (profileOverlay) profileOverlay.classList.remove('active');
        });
    }
});

// Cargar perfil desde el backend
window.loadProfile = async function() {
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid) {
        console.warn('No uid found');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/profile/${uid}`);
        if (!response.ok) throw new Error('Error al cargar perfil');
        const profile = await response.json();
        renderProfile(profile);
    } catch (error) {
        console.error(error);
        if (profileContent) profileContent.innerHTML = '<p class="error">No se pudo cargar el perfil. Intenta más tarde.</p>';
    }
};

// Renderizar todo el contenido del perfil
function renderProfile(profile) {
    if (!profileContent) return;
    
    // Destructurar datos
    const { name, preferences, critical_path, topic_mastery, total_interactions, mastery_history } = profile;
    
    // Construir HTML
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
    
    // Dominio por tema (barras)
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
    
    // Interacciones totales
    html += `<div class="profile-section"><h3>📈 Actividad total</h3><p><strong>Total de interacciones:</strong> ${total_interactions || 0}</p><p class="hint">(Cada pregunta respondida cuenta como una interacción)</p></div>`;
    
    // Historial de evolución (cada 3 interacciones)
    html += `<div class="profile-section"><h3>📉 Evolución del dominio global</h3><canvas id="masteryChart" width="400" height="200"></canvas><p class="hint">Promedio cada 3 interacciones</p></div>`;
    
    profileContent.innerHTML = html;
    
    // Dibujar gráfico si hay datos
    if (mastery_history && mastery_history.length > 0) {
        drawMasteryChart(mastery_history);
    } else {
        const canvas = document.getElementById('masteryChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('No hay suficientes interacciones aún', 40, 100);
        }
    }
}

// 🔧 CORREGIDO: nombre de la función coincide con la llamada
function drawMasteryChart(history) {
    const canvas = document.getElementById('masteryChart');
    if (!canvas) return;
    
    // Destruir gráfico anterior si existe
    if (profileChart) {
        profileChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const labels = history.map(item => `Interacciones ${item.interactions_range}`);
    const masteryPercent = history.map(item => item.global_mastery * 100);
    
    profileChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dominio global ponderado (%)',
                data: masteryPercent,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Dominio (%)', color: '#cbd5e1' },
                    grid: { color: '#334155' }
                },
                x: {
                    title: { display: true, text: 'Bloques de 3 interacciones', color: '#cbd5e1' },
                    ticks: { maxRotation: 30, autoSkip: true }
                }
            },
            plugins: {
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toFixed(1)}%` } },
                legend: { labels: { color: '#e2e8f0' } }
            }
        }
    });
}

// Función auxiliar para color según mastery
function getMasteryColor(mastery) {
    if (mastery < 0.45) return '#ef4444';      // rojo
    if (mastery < 0.85) return '#f59e0b';      // naranja
    return '#10b981';                          // verde
}

// Escapar HTML para evitar XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}