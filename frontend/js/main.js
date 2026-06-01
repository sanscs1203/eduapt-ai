/* ============================================================
   EduAdapt AI – main.js
   Inicialización principal de la interfaz del tutor.
   Compatible con Vector S multitema (estado del estudiante).
   Se ejecuta exclusivamente en index.html.
   ============================================================ */

import { CONFIG } from './config.js';
import { logout } from './auth.js';
import { recoverPendingSession } from './session.js';

// ============================================================================
// Verificar que estamos en la página principal (index.html)
// ============================================================================
if (document.getElementById('messagesWrap')) {

  // --------------------------------------------------------------------------
  // 1. Validación de sesión: si no hay login, redirigir al login
  // --------------------------------------------------------------------------
  if (!sessionStorage.getItem('edu_logged')) {
    window.location.href = 'login.html';
  } else {
    // ========================================================================
    // 2. Restauración del estado del estudiante (Vector S)
    // ========================================================================
    const storedSRaw = sessionStorage.getItem('edu_S');
    if (storedSRaw) {
      try {
        window.studentS = JSON.parse(storedSRaw);
      } catch (e) {
        console.error('[main.js] Error parsing S', e);
      }
    }

    // Modo piloto por defecto (adaptativo)
    window.pilotMode = 'adaptive';

    // ========================================================================
    // 3. Definición de la función updateStatePanelUI (panel lateral)
    //    Esta función actualiza la visualización del dominio del tema actual.
    //    Se expone globalmente para que otros scripts (ej. chat.js) puedan llamarla.
    // ========================================================================
    window.updateStatePanelUI = function () {
      const placeholder = document.getElementById('topicDomainPlaceholder');
      const valueContainer = document.getElementById('topicDomainValue');
      const percentEl = document.getElementById('topicDomainPercent');
      const topicNameEl = document.getElementById('topicDomainTopicName');

      // Si falta algún elemento, salir silenciosamente
      if (!placeholder || !valueContainer || !percentEl || !topicNameEl) return;

      // Si no hay tema actual, mostrar el placeholder
      if (!window.currentTopic) {
        placeholder.style.display = 'block';
        valueContainer.style.display = 'none';
        return;
      }

      placeholder.style.display = 'none';
      valueContainer.style.display = 'flex';

      // Obtener el mastery (dominio) del estudiante para el tema actual
      const S = window.studentS;
      let mastery = 0;
      if (Array.isArray(S)) {
        const temaData = S.find(t => t.topic === window.currentTopic);
        if (temaData) mastery = temaData.mastery || 0;
      }

      const percent = Math.round(mastery * 100);
      const topicLabel = CONFIG.TOPIC_LABELS[window.currentTopic] || window.currentTopic;

      percentEl.textContent = `${percent}%`;
      topicNameEl.textContent = topicLabel;

      // Cambiar color del porcentaje según el nivel de dominio
      if (percent < 60) percentEl.style.color = '#ef4444';      // Rojo (bajo)
      else if (percent < 80) percentEl.style.color = '#f97316'; // Naranja (medio)
      else percentEl.style.color = '#22c55e';                   // Verde (alto)

      // El nombre del tema queda con color neutro
      topicNameEl.style.color = 'var(--text-muted)';
    };

    // Llamada inicial para reflejar el estado actual del estudiante
    window.updateStatePanelUI();

    // ========================================================================
    // 4. Configuración de la interfaz de usuario (nombre, avatar, bienvenida)
    // ========================================================================
    const storedName = sessionStorage.getItem('edu_user') || 'Estudiante';
    document.getElementById('userName').textContent = storedName;
    document.getElementById('welcomeName').textContent = storedName.split(' ')[0];
    document.getElementById('userAvatar').textContent = window.getInitial(storedName); // función global definida en otro lugar

    // ========================================================================
    // 5. Chips de temas (tópicos) en la pantalla de bienvenida
    //    Al hacer clic, inician una conversación guiada sobre el tema.
    // ========================================================================
    document.querySelectorAll('.topic-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const topic = chip.getAttribute('data-topic');
        if (!topic) return;

        // Si ya hay un tema diferente activo, cerrar la sesión anterior
        if (window.currentTopic && window.currentTopic !== topic) {
          await window.closeSession(true);
        }

        window.showChatArea(); // Muestra el área de chat (oculta la pantalla de bienvenida)

        // Actualizar la barra superior con el tema seleccionado
        const topbar = document.getElementById('topbarSubject');
        if (topbar) {
          topbar.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            ${CONFIG.TOPIC_LABELS[topic] || topic}
          `;
        }

        // Establecer el tema actual
        window.currentTopic = topic;
        window.updateStatePanelUI();

        // Simular que el usuario escribe su selección
        window.appendMessage(`Quiero trabajar con **${CONFIG.TOPIC_LABELS[topic] || topic}**`, 'user');

        // Respuesta del tutor ofreciendo opciones
        window.appendMessage(
          `Perfecto, eligiste **${CONFIG.TOPIC_LABELS[topic] || topic}**. ¿Qué te gustaría hacer?\n\n- **Practicar** con ejercicios adaptados a tu nivel.\n- **Estudiar** la teoría y ver recursos.`,
          'bot'
        );
      });
    });

    // ========================================================================
    // 6. Manejo del input de chat (textarea)
    //    - Ajuste automático de altura
    //    - Envío con Enter (sin Shift) o con botón
    // ========================================================================
    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');

    // Ajustar altura dinámica del textarea al escribir
    msgInput.addEventListener('input', () => {
      sendBtn.disabled = msgInput.value.trim() === '';
      msgInput.style.height = 'auto';
      msgInput.style.height = Math.min(msgInput.scrollHeight, 160) + 'px';
    });

    // Enviar mensaje con Enter (sin Shift)
    msgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
          window.handleMessage(msgInput.value.trim());
        }
      }
    });

    // Enviar mensaje con el botón de enviar
    sendBtn.addEventListener('click', () => {
      if (!sendBtn.disabled) {
        window.handleMessage(msgInput.value.trim());
      }
    });

    // ========================================================================
    // 7. Botón "Nuevo chat" – reinicia la conversación y limpia el estado
    // ========================================================================
    document.getElementById('newChatBtn').addEventListener('click', async () => {
      await window.closeSession(true);                 // Cerrar sesión de práctica activa
      document.getElementById('chatMessages').innerHTML = '';   // Limpiar mensajes
      document.getElementById('welcomeScreen').style.display = ''; // Mostrar pantalla de bienvenida

      const topbar = document.getElementById('topbarSubject');
      if (topbar) {
        topbar.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Álgebra
        `;
      }

      window.chatVisible = false;
      window.pendingQuestion = null;
      window.currentTopic = null;
      window.updateStatePanelUI();
      closeSidebar(); // Función definida más abajo
    });

    // ========================================================================
    // 8. Botón de cierre de sesión (logout)
    // ========================================================================
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await window.closeSession(false);   // Cerrar sesión sin intentar reanudar
      await logout();                     // Cerrar sesión en Firebase
      window.location.href = 'login.html';
    });

    // ========================================================================
    // 9. Funcionalidad de la barra lateral (sidebar) con overlay
    // ========================================================================
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Evitar scroll del fondo
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // ========================================================================
    // 10. Recuperar sesión pendiente (si existe)
    //     La función recoverPendingSession está definida en session.js
    // ========================================================================
    recoverPendingSession();

    // ========================================================================
    // 11. Mostrar el perfil del usuario al hacer clic en la tarjeta de usuario
    // ========================================================================
    const userCard = document.querySelector('.user-card');
    if (userCard) {
      userCard.addEventListener('click', () => {
        window.loadProfile();                     // Cargar datos del perfil (definida en otro script)
        const profileOverlay = document.getElementById('profileOverlay');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (profileOverlay) profileOverlay.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
      });
    }
  }
}