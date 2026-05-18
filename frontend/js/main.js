/* ============================================================
   EduAdapt AI – main.js
   Inicialización principal
   Compatible con Vector S multitema
   ============================================================ */

import { CONFIG } from './config.js';
import { logout } from './auth.js';
import { recoverPendingSession } from './session.js';

// Solo ejecutar en index.html

if (document.getElementById('messagesWrap')) {
  if (!sessionStorage.getItem('edu_logged')) {
    window.location.href = 'login.html';
  } else {
    // Restaurar Vector S
    const storedSRaw = sessionStorage.getItem('edu_S');
    if (storedSRaw) {
      try {
        window.studentS = JSON.parse(storedSRaw);
      } catch (e) {
        console.error('[main.js] Error parsing S', e);
      }
    }

    window.pilotMode = 'adaptive';

    // ═════════════════════════════════════════
    // DEFINIR updateStatePanelUI (UNA SOLA VEZ)
    // ═════════════════════════════════════════
    window.updateStatePanelUI = function () {
      console.log('Ejecutando updateStatePanelUI manual');
      const placeholder = document.getElementById('topicDomainPlaceholder');
      const valueContainer = document.getElementById('topicDomainValue');
      const percentEl = document.getElementById('topicDomainPercent');
      console.log('Elementos:', { placeholder, valueContainer, percentEl });
      if (!placeholder || !valueContainer || !percentEl) {
        console.log('Faltan elementos');
        return;
      }
      if (!window.currentTopic) {
        placeholder.style.display = 'block';
        valueContainer.style.display = 'none';
        console.log('Sin tema, mostrando placeholder');
        return;
      }
      placeholder.style.display = 'none';
      valueContainer.style.display = 'flex';
      const S = window.studentS;
      let mastery = 0;
      if (Array.isArray(S)) {
        const temaData = S.find(t => t.topic === window.currentTopic);
        if (temaData) mastery = temaData.mastery || 0;
      }
      const percent = Math.round(mastery * 100);
      percentEl.textContent = `${percent}%`;
      if (percent < 60) percentEl.style.color = '#ef4444';
      else if (percent < 80) percentEl.style.color = '#f97316';
      else percentEl.style.color = '#22c55e';
      console.log('Panel actualizado a', percent + '%');
    };

    // Llamada inicial para reflejar el estado actual
    window.updateStatePanelUI();

    // ========================================================
    // Usuario UI
    // ========================================================

    const storedName =
      sessionStorage.getItem('edu_user')
      || 'Estudiante';
    document.getElementById('userName')
      .textContent = storedName;
    document.getElementById('welcomeName')
      .textContent =
        storedName.split(' ')[0];
    document.getElementById('userAvatar')
      .textContent =
        window.getInitial(storedName);

    // TOPIC CHIPS

    // CHIPS DE BIENVENIDA → iniciar conversación guiada
    document.querySelectorAll('.topic-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const topic = chip.getAttribute('data-topic');
        if (!topic) return;

        // Si ya hay un tema diferente activo, cerramos la sesión anterior
        if (window.currentTopic && window.currentTopic !== topic) {
          await window.closeSession(true);
        }

        window.showChatArea();

        // Actualizar la barra superior con el nuevo tema
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

        // Establecer el tópico actual
        window.currentTopic = topic;

        window.updateStatePanelUI();

        // Enviar mensaje del usuario (selección visual) como si hubiera escrito el tema
        window.appendMessage(`Quiero trabajar con **${CONFIG.TOPIC_LABELS[topic] || topic}**`, 'user');

        // Respuesta guiada del tutor
        window.appendMessage(
          `Perfecto, eligiste **${CONFIG.TOPIC_LABELS[topic] || topic}**. ¿Qué te gustaría hacer?\n\n- **Practicar** con ejercicios adaptados a tu nivel.\n- **Estudiar** la teoría y ver recursos.`,
          'bot'
        );
      });
    });

    // INPUT CHAT

    const msgInput =
      document.getElementById('msgInput');
    const sendBtn =
      document.getElementById('sendBtn');
    msgInput.addEventListener('input', () => {
      sendBtn.disabled =
        msgInput.value.trim() === '';
      msgInput.style.height = 'auto';
      msgInput.style.height =
        Math.min(
          msgInput.scrollHeight,
          160
        ) + 'px';
    });

    msgInput.addEventListener(
      'keydown',
      (e) => {
        if (
          e.key === 'Enter' &&
          !e.shiftKey
        ) {
          e.preventDefault();
          if (!sendBtn.disabled) {
            window.handleMessage(
              msgInput.value.trim()
            );
          }
        }
      }
    );

    sendBtn.addEventListener('click', () => {
      if (!sendBtn.disabled) {
        window.handleMessage(
          msgInput.value.trim()
        );
      }
    });

    // NUEVO CHAT

    document.getElementById('newChatBtn')
      .addEventListener('click', async () => {
        await window.closeSession(true);
        document.getElementById(
          'chatMessages'
        ).innerHTML = '';
        document.getElementById(
          'welcomeScreen'
        ).style.display = '';

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

        closeSidebar();
      });

    // LOGOUT

    document.getElementById('logoutBtn')
      .addEventListener('click', async () => {
        await window.closeSession(false);
        await logout();
        window.location.href =
          'login.html';
      });

    // SIDEBAR
    const menuToggle =
      document.getElementById('menuToggle');
    const sidebar =
      document.getElementById('sidebar');
    const sidebarClose =
      document.getElementById('sidebarClose');
    const sidebarOverlay =
      document.getElementById('sidebarOverlay');

    function openSidebar() {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('open');
      document.body.style.overflow =
        'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener(
      'click',
      openSidebar
    );

    sidebarClose.addEventListener(
      'click',
      closeSidebar
    );

    sidebarOverlay.addEventListener(
      'click',
      closeSidebar
    );

    // Recuperar sesión pendiente

    recoverPendingSession();

    // Abrir perfil al hacer clic en la tarjeta de usuario
    const userCard = document.querySelector('.user-card');
    if (userCard) {
      userCard.addEventListener('click', () => {
        window.openProfile();
      });
    }

  }
}