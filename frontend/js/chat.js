/* ============================================================
   EduAdapt AI – chat.js
   Interfaz del chat con el tutor
   ============================================================ */

let chatVisible = false;

function showChatArea() {
  if (!chatVisible) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    welcomeScreen.style.display = 'none';
    chatVisible = true;
  }
}

function scrollToBottom() {
  const messagesWrap = document.getElementById('messagesWrap');
  messagesWrap.scrollTo({ top: messagesWrap.scrollHeight, behavior: 'smooth' });
}

function appendMessage(html, sender) {
  showChatArea();
  const chatMessages = document.getElementById('chatMessages');
  const isUser = sender === 'user';
  const row = document.createElement('div');
  row.className = `msg-row ${isUser ? 'user' : 'bot'}`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = `msg-avatar ${isUser ? 'user-av' : 'bot'}`;
  avatarDiv.innerHTML = isUser
    ? getInitial(sessionStorage.getItem('edu_user'))
    : `<svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" stroke="#3B82F6" stroke-width="1.5" fill="none"/><circle cx="14" cy="14" r="3" fill="#3B82F6"/></svg>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = renderText(html);

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = isUser ? `Tú · ${formatTime()}` : `EduAdapt AI · ${formatTime()}`;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;flex-direction:column;${isUser ? 'align-items:flex-end' : ''}`;
  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);

  row.appendChild(avatarDiv);
  row.appendChild(wrapper);
  chatMessages.appendChild(row);
  scrollToBottom();
}

function showTyping() {
  const chatMessages = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.id = 'typingRow';
  const av = document.createElement('div');
  av.className = 'msg-avatar bot';
  av.innerHTML = `<svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" stroke="#3B82F6" stroke-width="1.5" fill="none"/><circle cx="14" cy="14" r="3" fill="#3B82F6"/></svg>`;
  const bub = document.createElement('div');
  bub.className = 'msg-bubble';
  bub.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  row.appendChild(av);
  row.appendChild(bub);
  chatMessages.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const t = document.getElementById('typingRow');
  if (t) t.remove();
}

async function handleMessage(text) {
  if (!text.trim()) return;
  appendMessage(text, 'user');
  const msgInput = document.getElementById('msgInput');
  msgInput.value = '';
  msgInput.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;

  const lower = text.toLowerCase().trim();

  // Feedback pendiente
  if (pendingFeedback) {
    if (lower === 'me sirvió' || lower === 'me sirvio') {
      await fetch(`${CONFIG.API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession?.sessionId,
          question_id: pendingFeedback.questionId,
          useful: true,
          uid: sessionStorage.getItem('edu_uid')
        })
      });
      pendingFeedback = null;
      appendMessage('👍 ¡Registrado! Me alegra que el recurso te haya sido útil.', 'bot');
      offerNextQuestion();
      return;
    }
    if (lower === 'no me sirvió' || lower === 'no me sirvio') {
      await fetch(`${CONFIG.API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession?.sessionId,
          question_id: pendingFeedback.questionId,
          useful: false,
          uid: sessionStorage.getItem('edu_uid')
        })
      });
      pendingFeedback = null;
      appendMessage('👎 Registrado. Evitaré repetirte ese recurso.', 'bot');
      offerNextQuestion();
      return;
    }
    pendingFeedback = null;
  }

  // Si hay pregunta pendiente
  if (pendingQuestion) {
    showTyping();
    const result = await submitAnswer(text);
    removeTyping();
    if (result) {
      if (result.is_correct) {
        appendMessage(`✅ **¡Correcto!** ${result.explanation || ''}`, 'bot');
      } else {
        appendMessage(`❌ **No exactamente.** ${result.explanation || ''}`, 'bot');
      }
      if (result.resource) {
        pendingFeedback = {
          questionId: pendingQuestion.id
        };
        setTimeout(() => {
          appendMessage(`📚 Recurso: [${result.resource.title}](${result.resource.url})\n\n¿El recurso te sirvió? Escribe **"me sirvió"** o **"no me sirvió"**.`, 'bot');
        }, 800);
      }
      pendingQuestion = null;
      // Si el backend devuelve siguiente pregunta, se podría mostrar automáticamente
      if (result.next_question) {
        pendingQuestion = result.next_question;
        pendingQuestion.deliveredAt = Date.now();
        setTimeout(() => {
          appendMessage(`Siguiente: **${result.next_question.question}**`, 'bot');
        }, 1500);
      } else {
        setTimeout(() => offerNextQuestion(), 2000);
      }
    }
    return;
  }

  // Comandos de continuación
  if ((lower === 'sí' || lower === 'si' || lower === 'siguiente' || lower === 'otra') && currentTopic) {
    if (!activeSession) await startSession(currentTopic);
    showTyping();
    const q = await fetchNextQuestion();
    removeTyping();
    if (q) {
      pendingQuestion = q;
      pendingQuestion.deliveredAt = Date.now();
      appendMessage(`**${q.question}**`, 'bot');
    }
    return;
  }

  if (lower === 'cambiar' || lower === 'otro tema') {
    const metrics = await closeSession(true);
    if (metrics) {
      appendMessage(formatSummary(metrics), 'bot');
    }
    appendMessage('¡Claro! Selecciona un tema de la barra lateral o escribe el nombre del tema.', 'bot');
    return;
  }

  // Detección de tema por texto
  const detectedTopic = detectTopicFromText(lower);
  if (detectedTopic) {
    if (currentTopic && currentTopic !== detectedTopic) await closeSession(true);
    showTyping();
    const q = await startSession(detectedTopic);
    removeTyping();
    if (q) {
      pendingQuestion = q;
      pendingQuestion.deliveredAt = Date.now();
      appendMessage(`Perfecto, vamos con **${CONFIG.TOPIC_LABELS[detectedTopic]}**.`, 'bot');
      appendMessage(`**${q.question}**`, 'bot');
    }
    return;
  }

  // Respuesta genérica
  showTyping();
  setTimeout(async () => {
    removeTyping();
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        uid: sessionStorage.getItem('edu_uid'),
        S: studentS
      })
    });
    const data = await res.json();
    appendMessage(data.reply || 'No entendí. ¿Puedes elegir un tema?', 'bot');
  }, 600);
}

async function fetchNextQuestion() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/api/session/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: activeSession?.sessionId,
      uid: sessionStorage.getItem('edu_uid')
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.question;
}

function offerNextQuestion() {
  if (activeSession && activeSession.questions.length >= CONFIG.PILOT_QUESTION_LIMIT) {
    appendMessage(`✅ **Sesión piloto completada** (${CONFIG.PILOT_QUESTION_LIMIT} preguntas respondidas). Guardando resumen...`, 'bot');
    closeSession(true).then(metrics => {
      if (metrics) appendMessage(formatSummary(metrics), 'bot');
    });
  } else {
    appendMessage(`¿Continuamos con **${CONFIG.TOPIC_LABELS[currentTopic]}**? Escribe **"sí"** para otra pregunta, **"cambiar"** para cerrar esta sesión y cambiar de tema.`, 'bot');
  }
}

function detectTopicFromText(msg) {
  const m = msg.toLowerCase();
  if (/polinomio|pol[íi]nom|t[eé]rmino|binomio|trinomio/.test(m)) return 'polinomios';
  if (/factori[sz]|factor\s|factor\b/.test(m)) return 'factorizacion';
  if (/ecuaci[oó]n|despeja|resuelve|resolver|ecuaciones/.test(m)) return 'ecuaciones';
  if (/sistema|sistemas|dos ecuaciones/.test(m)) return 'sistemas';
  if (/fracci[oó]n|racional|denominador|numerador/.test(m)) return 'fracciones';
  if (/potencia|exponente|radical|ra[íi]z|potencias/.test(m)) return 'potencias';
  if (/funci[oó]n|pendiente|linear|lineal|funciones/.test(m)) return 'funciones';
  if (/inecuaci[oó]n|desigualdad|inequalit/.test(m)) return 'inecuaciones';
  return null;
}

function formatSummary(metrics) {
  const mins = Math.floor(metrics.totalTimeSec / 60);
  const secs = Math.round(metrics.totalTimeSec % 60);
  const durationStr = mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;
  return `📊 **Resumen de sesión — ${metrics.topicLabel}**\n\n⏱️ Duración: **${durationStr}**\n❓ Preguntas: **${metrics.totalQuestions}**\n✅ Correctas: **${metrics.correctCount}** | ❌ Incorrectas: **${metrics.incorrectCount}**\n🎯 Precisión: **${Math.round(metrics.accuracy * 100)}%**\n\n🗺️ Ruta sugerida: ${metrics.suggestedPath}`;
}