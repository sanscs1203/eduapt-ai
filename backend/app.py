# app.py
import sys
import os
from pathlib import Path
import json
import uuid
import pickle
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import firestore

from config import Config
from firebase_client import FirebaseClient
from agents.student_model import StudentModel
from agents.answer_evaluator import AnswerEvaluator

# Recomendadores
from recommenders.base_recommender import BaseRecommender
from recommenders.knn_recommender import KNNRecommender
from recommenders.svd_recommender import SVDRecommender
from recommenders.random_forest_rec import RandomForestRecommender

# LLMs
from llm.base_llm import BaseLLM
from llm.dialo_gpt import DialoGPTLLM
from llm.bert_templates import BertTemplateLLM
from llm.seq2seq_attention import Seq2SeqAttentionLLM

sys.path.insert(0, str(Path(__file__).parent))


app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

# Inicializar clientes y modelos
firebase_client = FirebaseClient()
evaluator = AnswerEvaluator()
student_model = StudentModel()

# Banco de preguntas cargado en memoria
QUESTION_BANK = {}

# Modelos de recomendación (se llenan al inicio si los archivos existen)
recommenders = {
    'knn': None,
    'svd': None,
    'rf': None
}

# Modelos de lenguaje
llm_models = {
    'dialogpt': None,
    'bert_template': BertTemplateLLM(),
    'seq2seq': None
}

# Sesiones activas en memoria (diccionario)
active_sessions = {}


# ----------------------------------------------------------------
# Carga inicial
# ----------------------------------------------------------------
def load_question_bank():
    global QUESTION_BANK
    path = app.config['QUESTION_BANK_PATH']
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            QUESTION_BANK = json.load(f)
        print(f"Question bank loaded: {sum(len(v) for v in QUESTION_BANK.values())} questions")
    else:
        print(f"WARN: Question bank not found at {path}")
        # Banco mínimo de prueba
        QUESTION_BANK = {
            "polinomios": [
                {
                    "id": "POL-01",
                    "type": "Procedural",
                    "difficulty": "Easy",
                    "question": "Simplifica: (3x² + 2x) + (5x² − 7x)",
                    "answer": "8x² − 5x",
                    "link": "https://www.khanacademy.org/math/algebra"
                }
            ]
        }

def load_recommenders():
    for name, cls in [('knn', KNNRecommender), ('svd', SVDRecommender), ('rf', RandomForestRecommender)]:
        path = os.path.join(app.config['MODELS_DIR'], f'{name}_model.pkl')
        if os.path.exists(path):
            with open(path, 'rb') as f:
                recommenders[name] = pickle.load(f)
            print(f"Loaded {name} recommender")
        else:
            print(f"Model {name} not found, will use static fallback")

def load_llms():
    # DialoGPT es pesado, cargar solo si se necesita (bajo demanda)
    try:
        llm_models['dialogpt'] = DialoGPTLLM()
        print("DialoGPT loaded")
    except Exception as e:
        print(f"Could not load DialoGPT: {e}")

    try:
        llm_models['seq2seq'] = Seq2SeqAttentionLLM()
        print("Seq2Seq loaded")
    except Exception as e:
        print(f"Could not load Seq2Seq: {e}")


# ----------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------
def pick_question(topic, S, used_ids, mode='adaptive'):
    """Selecciona siguiente pregunta del banco según modo y estado S"""
    pool = QUESTION_BANK.get(topic, [])
    if not pool:
        return None

    available = [q for q in pool if q['id'] not in used_ids]
    if not available:
        # Reiniciar preguntas usadas si ya se agotaron
        available = pool

    if mode == 'baseline':
        return available[0] if available else None

    # Modo adaptativo: ordenar por cercanía a la dificultad objetivo
    target_diff = student_model.get_target_difficulty(S)
    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
    available.sort(key=lambda q: abs(diff_order.get(q.get('difficulty', 'Medium'), 1) - diff_order[target_diff]))
    return available[0] if available else None

def find_question_by_id(qid):
    """Busca una pregunta por ID en todo el banco"""
    for topic, questions in QUESTION_BANK.items():
        for q in questions:
            if q.get('id') == qid:
                q = q.copy()
                q['topic'] = topic
                return q
    return None


# ----------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'question_bank_loaded': len(QUESTION_BANK) > 0,
        'recommenders_loaded': [name for name, m in recommenders.items() if m is not None],
        'llms_loaded': [name for name, m in llm_models.items() if m is not None]
    })

@app.route('/api/session/start', methods=['POST'])
def session_start():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    mode = data.get('mode', 'adaptive')
    S = data.get('S')

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    # Si no se envía S, intentar obtenerlo del usuario en Firestore
    if not S and uid:
        user = firebase_client.get_user(uid)
        if user and 'S' in user:
            S = user['S']
    if not S:
        S = student_model.initial_state('mid')

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

    S = session['S']
    topic = session['topic']
    used = session['used_questions']
    mode = session['mode']

    question = pick_question(topic, S, used, mode)
    if question:
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

    question = find_question_by_id(question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404

    # Manejar petición directa de ver respuesta
    if user_answer.lower().strip() in ('ver respuesta', 'no sé', 'no se', 'respuesta'):
        result = {
            'is_correct': False,
            'explanation': f"La respuesta correcta es: {question['answer']}. Te sugiero estudiar el recurso asociado.",
            'method': 'direct-answer'
        }
    else:
        result = evaluator.evaluate(user_answer, question['answer'], question.get('type', 'Procedural'))

    # Actualizar estado S
    old_S = session['S']
    # Obtener self_level del perfil si es posible
    self_level = 'mid'
    if uid:
        user = firebase_client.get_user(uid)
        if user and 'selfLevel' in user:
            self_level = user['selfLevel']
    new_S = student_model.update(old_S, result['is_correct'], response_time, self_level)
    session['S'] = new_S

    # Registrar pregunta en la sesión
    session['questions'].append({
        'question_id': question_id,
        'correct': result['is_correct'],
        'time_spent': response_time,
        'S_before': old_S,
        'S_after': new_S
    })

    # Guardar interacción en Firestore (ignorar si falla)
    try:
        firebase_client.save_interaction({
            'uid': uid,
            'session_id': session_id,
            'topic': session['topic'],
            'question_id': question_id,
            'difficulty': question.get('difficulty'),
            'type': question.get('type'),
            'pilotMode': session['mode'],
            'userMsg': user_answer,
            'correct': result['is_correct'],
            'S_after': new_S,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error saving interaction: {e}")

    # Siguiente pregunta
    used = session['used_questions']
    used.add(question_id)
    next_question = pick_question(session['topic'], new_S, used, session['mode'])

    # Recurso asociado a esta pregunta
    resource = {
        'title': f"Recurso: {question.get('id', '')}",
        'url': question.get('link', '#'),
        'type': question.get('type', ''),
        'description': question.get('answer', '')[:100] + '...'
    }

    # Explicación XAI
    tier = student_model.get_tier(new_S)
    explanation = (
        f"Tu precisión actual es {new_S['a']:.2f} (nivel: {tier}). "
        f"Has respondido {'correctamente' if result['is_correct'] else 'incorrectamente'} "
        f"a esta pregunta de dificultad {question.get('difficulty', 'Medium')} "
        f"en {question.get('topic', session['topic'])}."
    )

    return jsonify({
        'is_correct': result['is_correct'],
        'explanation': result['explanation'],
        'S_new': new_S,
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
    accuracy = correct / total if total else 0
    total_time = sum(q.get('time_spent', 0) for q in questions)

    metrics = {
        'session_id': session_id,
        'topic': session['topic'],
        'topicLabel': session.get('topicLabel', session['topic']),
        'totalQuestions': total,
        'correctCount': correct,
        'incorrectCount': total - correct,
        'accuracy': round(accuracy, 2),
        'totalTimeSec': round(total_time, 1),
        'avgTimeSec': round(total_time / total, 1) if total else 0,
        'suggestedPath': 'Seguir practicando para mejorar la precisión.',
        'S_end': session['S']
    }

    # Guardar sesión en Firestore
    try:
        firebase_client.save_session({
            'sessionId': session_id,
            'uid': session['uid'],
            'topic': session['topic'],
            'topicLabel': session.get('topicLabel', ''),
            'pilotMode': session['mode'],
            'pilotRunId': 'pilot_final_2026_05',
            'startedAt': session['start_time'],
            'endedAt': firestore.SERVER_TIMESTAMP,
            'totalQuestions': total,
            'correctCount': correct,
            'accuracy': accuracy,
            'totalTimeSec': total_time,
            'questions': questions
        })
    except Exception as e:
        print(f"Error saving session: {e}")

    return jsonify(metrics)

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    mode = data.get('mode', 'adaptive')
    S = data.get('S')
    # Modelo a usar: knn, svd, rf (por defecto knn si está disponible)
    model_name = request.args.get('model', 'knn')

    if not S and uid:
        user = firebase_client.get_user(uid)
        if user and 'S' in user:
            S = user['S']
    if not S:
        S = student_model.initial_state()

    # Intentar usar modelo de recomendación
    model = recommenders.get(model_name)
    resources = []
    model_used = 'static'

    if model:
        try:
            recommended_ids = model.recommend(uid, topic, S, n=3)
            for qid in recommended_ids:
                q = find_question_by_id(qid)
                if q:
                    resources.append({
                        'id': qid,
                        'title': q['question'][:60],
                        'url': q.get('link', '#'),
                        'type': q.get('type', ''),
                        'justification': (
                            f"Recomendado por modelo {model_name.upper()} porque "
                            f"tu precisión ({S['a']:.2f}) y nivel ({student_model.get_tier(S)}) "
                            f"indican que este recurso de dificultad {q.get('difficulty', 'Media')} es adecuado."
                        )
                    })
            model_used = model_name
        except Exception as e:
            print(f"Recommender {model_name} failed: {e}")

    # Fallback a recursos estáticos si no se obtuvieron suficientes
    if len(resources) < 3:
        pool = QUESTION_BANK.get(topic, [])
        for q in pool:
            if len(resources) >= 3:
                break
            # Evitar duplicados
            if not any(r['id'] == q['id'] for r in resources):
                resources.append({
                    'id': q['id'],
                    'title': q['question'][:60],
                    'url': q.get('link', '#'),
                    'type': q.get('type', ''),
                    'justification': f"Recurso del tema {topic} para reforzar conceptos."
                })

    return jsonify({
        'resources': resources[:3],
        'model_used': model_used
    })

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.get_json()
    try:
        firebase_client.save_feedback({
            'uid': data.get('uid'),
            'sessionId': data.get('session_id'),
            'topic': data.get('topic'),
            'questionId': data.get('question_id'),
            'useful': data.get('useful', False),
            'createdAt': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error saving feedback: {e}")
    return jsonify({'status': 'ok'})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')
    model_name = data.get('model', 'bert_template')
    uid = data.get('uid')
    S = data.get('S')
    topic = data.get('topic')

    context = {
        'uid': uid,
        'S': S,
        'topic': topic,
        'mode': data.get('mode', 'adaptive')
    }

    llm = llm_models.get(model_name)
    if llm is None:
        llm = llm_models['bert_template']  # fallback seguro

    try:
        reply = llm.generate(message, context)
    except Exception as e:
        reply = f"Lo siento, ocurrió un error al generar la respuesta. Por favor selecciona un tema de Álgebra."

    return jsonify({
        'reply': reply,
        'model_used': llm.name() if hasattr(llm, 'name') else model_name
    })

@app.route('/api/models/status', methods=['GET'])
def models_status():
    return jsonify({
        'recommenders_available': [name for name, m in recommenders.items() if m is not None],
        'llms_available': [name for name, m in llm_models.items() if m is not None],
        'question_bank_size': sum(len(v) for v in QUESTION_BANK.values())
    })

# ----------------------------------------------------------------
# Inicio de la aplicación
# ----------------------------------------------------------------
if __name__ == '__main__':
    load_question_bank()
    os.makedirs(app.config['MODELS_DIR'], exist_ok=True)
    load_recommenders()
    # Cargar LLMs bajo demanda o aquí; DialoGPT puede ser pesado
    # load_llms()  # Descomentar si quieres cargar todos al iniciar
    app.run(debug=app.config['DEBUG'], host=app.config['HOST'], port=app.config['PORT'])