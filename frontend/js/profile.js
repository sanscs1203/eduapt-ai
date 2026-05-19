// frontend/js/profile.js
import { CONFIG } from './config.js';

let profileOverlay = null;
let profileContent = null;

document.addEventListener('DOMContentLoaded', () => {
    profileOverlay = document.getElementById('profileOverlay');
    profileContent = document.getElementById('profileContent');
    
    const profileBtn = document.getElementById('profileBtn');
    const profileClose = document.getElementById('profileClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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

window.loadProfile = async function() {
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/profile/${uid}`);
        if (!response.ok) throw new Error('Error al cargar perfil');
        const profile = await response.json();
        renderProfile(profile);
    } catch (error) {
        console.error(error);
        if (profileContent) profileContent.innerHTML = '<p class="error">No se pudo cargar el perfil.</p>';
    }
};

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

function getMasteryColor(mastery) {
    if (mastery < 0.45) return '#ef4444';
    if (mastery < 0.85) return '#f59e0b';
    return '#10b981';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}