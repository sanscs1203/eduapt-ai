/* ============================================================
   EduAdapt AI – main.js
   Inicialización de la app principal
   ============================================================ */

let pilotMode = CONFIG.DEFAULT_MODE;

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('messagesWrap')) return; // solo index.html

  if (!sessionStorage.getItem('edu_logged')) {
    window.location.href = 'login.html';
    return;
  }

  // Restaurar S
  const storedSRaw = sessionStorage.getItem('edu_S');
  if (storedSRaw) {
    try { studentS = JSON.parse(storedSRaw); } catch(e) {}
  }

  const storedName = sessionStorage.getItem('edu_user') || 'Estudiante';
  document.getElementById('userName').textContent = storedName;
  document.getElementById('welcomeName').textContent = storedName.split(' ')[0];
  document.getElementById('userAvatar').textContent = getInitial(storedName);
  updateStatePanelUI();

  // Eventos de chips de tópicos
  document.querySelectorAll('.topic-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const topic = chip.getAttribute('data-topic');
      if (!topic) return;
      if (currentTopic && currentTopic !== topic) await closeSession(true);
      showChatArea();
      appendMessage(`Quiero practicar: **${CONFIG.TOPIC_LABELS[topic]}**`, 'user');
      showTyping();
      const q = await startSession(topic);
      removeTyping();
      if (q) {
        appendMessage(`¡Vamos con **${CONFIG.TOPIC_LABELS[topic]}**! 🎯`, 'bot');
        pendingQuestion = q;
        pendingQuestion.deliveredAt = Date.now();
        appendMessage(`**${q.question}**`, 'bot');
      }
    });
  });

  // Eventos de historial (sidebar)
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const topic = item.getAttribute('data-topic');
      if (!topic) return;
      if (currentTopic && currentTopic !== topic) await closeSession(true);
      document.getElementById('chatMessages').innerHTML = '';
      chatVisible = false;
      showChatArea();
      document.getElementById('topbarSubject').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> ${CONFIG.TOPIC_LABELS[topic]}`;
      appendMessage(`Comenzamos con **${CONFIG.TOPIC_LABELS[topic]}**.`, 'bot');
      showTyping();
      const q = await startSession(topic);
      removeTyping();
      if (q) {
        pendingQuestion = q;
        pendingQuestion.deliveredAt = Date.now();
        appendMessage(`**${q.question}**`, 'bot');
      }
      closeSidebar();
    });
  });

  // Input de chat
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');
  msgInput.addEventListener('input', () => {
    sendBtn.disabled = msgInput.value.trim() === '';
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 160) + 'px';
  });
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleMessage(msgInput.value.trim());
    }
  });
  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) handleMessage(msgInput.value.trim());
  });

  // Nuevo chat
  document.getElementById('newChatBtn').addEventListener('click', async () => {
    await closeSession(true);
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('welcomeScreen').style.display = '';
    chatVisible = false;
    pendingQuestion = null;
    currentTopic = null;
    document.getElementById('topbarSubject').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Álgebra`;
    closeSidebar();
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await closeSession(false);
    await logout();
    window.location.href = 'login.html';
  });

  // Sidebar
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function openSidebar()  { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  menuToggle.addEventListener('click', openSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Toggle modo adaptativo / baseline
  const btnAdaptive = document.getElementById('btnAdaptive');
  const btnBaseline = document.getElementById('btnBaseline');
  function updatePilotToggleUI() {
    const isAdaptive = pilotMode === 'adaptive';
    btnAdaptive.style.background = isAdaptive ? 'var(--blue)' : 'transparent';
    btnAdaptive.style.color      = isAdaptive ? '#fff' : 'var(--text-muted)';
    btnBaseline.style.background = isAdaptive ? 'transparent' : 'var(--blue)';
    btnBaseline.style.color      = isAdaptive ? 'var(--text-muted)' : '#fff';
  }
  btnAdaptive.addEventListener('click', async () => {
    if (pilotMode === 'adaptive') return;
    if (activeSession) await closeSession(true);
    pilotMode = 'adaptive';
    updatePilotToggleUI();
    appendMessage('🧠 Modo cambiado a **Adaptativo**.', 'bot');
  });
  btnBaseline.addEventListener('click', async () => {
    if (pilotMode === 'baseline') return;
    if (activeSession) await closeSession(true);
    pilotMode = 'baseline';
    updatePilotToggleUI();
    appendMessage('📋 Modo cambiado a **Tradicional** (baseline).', 'bot');
  });
  updatePilotToggleUI();

  // Recuperar sesión pendiente (si existe localStorage)
  recoverPendingSession();
});

async function recoverPendingSession() {
  const uid = sessionStorage.getItem('edu_uid');
  if (!uid) return;
  const pendingKey = `edu_pending_session_${uid}`;
  const raw = localStorage.getItem(pendingKey);
  if (!raw) return;
  localStorage.removeItem(pendingKey);
  try {
    const { sessionId } = JSON.parse(raw);
    // Informar al backend para que guarde la sesión
    await fetch(`${CONFIG.API_BASE_URL}/api/session/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, uid })
    });
  } catch (_) {}
}