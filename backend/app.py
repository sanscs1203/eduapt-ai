# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from firebase_client import FirebaseClient
from agents.student_model import StudentModel
from agents.answer_evaluator import AnswerEvaluator
import uuid
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

# Inicializar clientes
firebase = FirebaseClient()
evaluator = AnswerEvaluator()
student_model = StudentModel()

# Banco de preguntas en memoria
QUESTION_BANK = {}

def load_question_bank():
    global QUESTION_BANK
    path = app.config['QUESTION_BANK_PATH']
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            QUESTION_BANK = json.load(f)
    else:
        print(f"WARN: Question bank not found at {path}, using empty bank.")

# Sesiones activas en memoria (para prototipo; en producción usar Redis o Firestore)
active_sessions = {}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/session/start', methods=['POST'])
def session_start():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    mode = data.get('mode', 'adaptive')
    S = data.get('S', student_model.initial_state())

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    active_sessions[session_id] = {
        'session_id': session_id,
        'uid': uid,
        'topic': topic,
        'mode': mode,
        'start_time': datetime.utcnow(),
        'questions': [],
        'S': S,
        'used_questions': set()
    }

    # Obtener primera pregunta
    question = pick_question(topic, S, set(), mode)

    return jsonify({
        'session_id': session_id,
        'first_question': question
    })

@app.route('/api/session/next', methods=['POST'])
def session_next():
    data = request.get_json()
    session_id = data.get('session_id')
    session = active_sessions.get(session_id)

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    topic = session['topic']
    S = session['S']
    used = session['used_questions']
    mode = session['mode']

    question = pick_question(topic, S, used, mode)
    if not question:
        return jsonify({'question': None, 'message': 'No more questions available.'})

    session['used_questions'].add(question['id'])
    return jsonify({'question': question})

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    data = request.get_json()
    session_id = data.get('session_id')
    user_answer = data.get('user_answer', '')
    question_id = data.get('question_id')
    response_time = data.get('response_time', 30)
    uid = data.get('uid')

    session = active_sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # Buscar la pregunta en el banco
    question = find_question_by_id(question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404

    # Evaluar respuesta
    if user_answer.lower() in ('ver respuesta', 'no sé', 'no se', 'respuesta'):
        result = {
            'is_correct': False,
            'explanation': f"La respuesta correcta es: {question['answer']}. Te recomiendo estudiar el recurso asociado.",
            'method': 'direct-answer'
        }
    else:
        result = evaluator.evaluate(user_answer, question['answer'], question.get('type', 'Procedural'))

    # Actualizar estado S
    S_old = session['S']
    self_level = 'mid'  # Se podría obtener del perfil
    S_new = student_model.update(S_old, result['is_correct'], response_time, self_level)
    session['S'] = S_new

    # Registrar en la sesión
    session['questions'].append({
        'question_id': question_id,
        'correct': result['is_correct'],
        'time_spent': response_time,
        'S_before': S_old,
        'S_after': S_new
    })

    # Guardar interacción en Firestore (async)
    try:
        firebase.save_interaction({
            'uid': uid,
            'session_id': session_id,
            'question_id': question_id,
            'user_answer': user_answer,
            'correct': result['is_correct'],
            'S_after': S_new,
            'created_at': firestore.SERVER_TIMESTAMP
        })
    except Exception:
        pass

    # Obtener siguiente pregunta
    used = session['used_questions']
    used.add(question_id)
    next_question = pick_question(session['topic'], S_new, used, session['mode'])

    # Recurso recomendado para esta pregunta
    resource = {
        'title': f"Recurso: {question['id']}",
        'url': question.get('link', ''),
        'type': question.get('type', ''),
        'description': question.get('answer', '')[:100] + '...'
    }

    # Explicación XAI
    tier = student_model.get_tier(S_new)
    explanation = (
        f"Tu precisión actual es {S_new['a']:.2f} (nivel: {tier}). "
        f"Has respondido {'correctamente' if result['is_correct'] else 'incorrectamente'} "
        f"a esta pregunta de dificultad {question.get('difficulty', 'Medium')} "
        f"en {question.get('topic', session['topic'])}."
    )

    return jsonify({
        'is_correct': result['is_correct'],
        'explanation': result['explanation'],
        'S_new': S_new,
        'next_question': next_question,
        'resource': resource,
        'xai_explanation': explanation
    })

@app.route('/api/session/close', methods=['POST'])
def session_close():
    data = request.get_json()
    session_id = data.get('session_id')
    session = active_sessions.pop(session_id, None)

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    questions = session['questions']
    if not questions:
        return jsonify({'message': 'No questions answered'})

    total = len(questions)
    correct = sum(1 for q in questions if q['correct'])
    accuracy = correct / total
    total_time = sum(q['time_spent'] for q in questions)

    metrics = {
        'session_id': session_id,
        'topic': session['topic'],
        'totalQuestions': total,
        'correctCount': correct,
        'incorrectCount': total - correct,
        'accuracy': round(accuracy, 2),
        'totalTimeSec': round(total_time, 1),
        'avgTimeSec': round(total_time / total, 1),
        'suggestedPath': 'Seguir practicando para mejorar la precisión.'
    }

    # Guardar en Firestore
    try:
        firebase.save_session({
            'session_id': session_id,
            'uid': session['uid'],
            'topic': session['topic'],
            'mode': session['mode'],
            'started_at': session['start_time'],
            'ended_at': firestore.SERVER_TIMESTAMP,
            'total_questions': total,
            'correct': correct,
            'accuracy': accuracy,
            'questions': questions,
            'S_start': questions[0]['S_before'] if questions else None,
            'S_end': session['S']
        })
    except Exception:
        pass

    return jsonify(metrics)

@app.route('/api/recommend', methods=['POST'])
def recommend():
    """Endpoint de recomendación de recursos (placeholder)"""
    data = request.get_json()
    topic = data.get('topic')
    # Aquí se integrarán los modelos k-NN, SVD, Random Forest
    resources = [
        {
            'title': f'Video: {topic}',
            'url': '#',
            'type': 'Video',
            'justification': 'Recomendado según tu nivel actual.'
        }
    ]
    return jsonify({'resources': resources})

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.get_json()
    # Guardar en Firestore
    try:
        firebase.save_feedback(data)
    except Exception:
        pass
    return jsonify({'status': 'ok'})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint de chat con LLM (placeholder)"""
    data = request.get_json()
    message = data.get('message', '')
    # Aquí se integrarán DialoGPT, BERT, Seq2Seq
    reply = f"He recibido tu mensaje: '{message}'. Estoy aquí para ayudarte con Álgebra."
    return jsonify({'reply': reply})

# --- Helpers ---

def pick_question(topic, S, used_ids, mode):
    """Selecciona la siguiente pregunta del banco según el modo"""
    pool = QUESTION_BANK.get(topic, [])
    if not pool:
        return None

    # Filtrar preguntas no usadas
    available = [q for q in pool if q['id'] not in used_ids]
    if not available:
        # Reiniciar si ya se usaron todas
        available = pool

    if mode == 'baseline':
        return available[0]

    # Modo adaptativo: ordenar por cercanía a dificultad objetivo
    target_diff = student_model.get_target_difficulty(S)
    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
    available.sort(key=lambda q: abs(diff_order.get(q.get('difficulty', 'Medium'), 1) - diff_order[target_diff]))
    return available[0]

def find_question_by_id(qid):
    for topic, questions in QUESTION_BANK.items():
        for q in questions:
            if q.get('id') == qid:
                q['topic'] = topic
                return q
    return None

# --- Inicialización ---

if __name__ == '__main__':
    load_question_bank()
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)