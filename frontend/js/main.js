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
    const storedSRaw =
      sessionStorage.getItem('edu_S');
    if (storedSRaw) {
      try {
        window.studentS =
          JSON.parse(storedSRaw);
      } catch (e) {
        console.error(
          '[main.js] Error parsing S',
          e
        );
      }
    }

    // ========================================================
    // Inicializar modo piloto
    // Basado en perfil real
    // ========================================================

    if (
      window.studentS &&
      window.studentS.d_global >= 0.65
    ) {

      window.pilotMode = 'adaptive';

    } else {

      window.pilotMode = 'baseline';
    }

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

    // ACTUALIZAR PANEL DE ESTADO

    window.updateStatePanelUI = function () {

      if (!window.studentS) return;

      const S = window.studentS;

      const topics =
        Object.entries(S.a_temas || {});

      if (!topics.length) return;

      // Promedio global

      const avg =
        topics.reduce((acc, [_, topic]) => {
          return acc + (topic.mastery || 0);
        }, 0) / topics.length;

      // ======================================================

      const strongest =
        [...topics].sort(
          (a, b) =>
            b[1].mastery - a[1].mastery
        )[0];

      // Tema débil

      const weakest =
        [...topics].sort(
          (a, b) =>
            a[1].mastery - b[1].mastery
        )[0];

      // Nivel global

      const masteryPercent =
        Math.round(avg * 100);

      const level =
        avg >= 0.8
          ? 'Avanzado'
          : avg >= 0.6
            ? 'Intermedio'
            : 'Básico';

      // UI Elements

      const levelEl =
        document.getElementById('stateLevel');

      if (levelEl) {

        levelEl.textContent =
          `${masteryPercent}% • ${level}`;
      }

      const strongEl =
        document.getElementById('strongTopic');

      if (strongEl && strongest) {

        strongEl.textContent =
          CONFIG.TOPIC_LABELS[
            strongest[0]
          ] || strongest[0];
      }

      const weakEl =
        document.getElementById('weakTopic');

      if (weakEl && weakest) {

        weakEl.textContent =
          CONFIG.TOPIC_LABELS[
            weakest[0]
          ] || weakest[0];
      }

      const diffEl =
        document.getElementById(
          'adaptiveDifficulty'
        );

      if (diffEl) {

        diffEl.textContent =
          `${Math.round(
            S.d_global * 100
          )}%`;
      }
    };

    // Ejecutar panel
    window.updateStatePanelUI();

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

    // TOGGLE MODOS

    const btnAdaptive =
      document.getElementById('btnAdaptive');

    const btnBaseline =
      document.getElementById('btnBaseline');

    function updatePilotToggleUI() {
      const isAdaptive =
        window.pilotMode === 'adaptive';

      btnAdaptive.style.background =
        isAdaptive
          ? 'var(--blue)'
          : 'transparent';

      btnAdaptive.style.color =
        isAdaptive
          ? '#fff'
          : 'var(--text-muted)';

      btnBaseline.style.background =
        isAdaptive
          ? 'transparent'
          : 'var(--blue)';

      btnBaseline.style.color =
        isAdaptive
          ? 'var(--text-muted)'
          : '#fff';
    }

    btnAdaptive.addEventListener(
      'click',
      async () => {
        if (
          window.pilotMode === 'adaptive'
        ) return;
        if (window.activeSession) {
          await window.closeSession(true);
        }
        window.pilotMode = 'adaptive';
        updatePilotToggleUI();
      }
    );

    btnBaseline.addEventListener(
      'click',
      async () => {
        if (
          window.pilotMode === 'baseline'
        ) return;
        if (window.activeSession) {
          await window.closeSession(true);
        }
        window.pilotMode = 'baseline';
        updatePilotToggleUI();
      }
    );

    updatePilotToggleUI();

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