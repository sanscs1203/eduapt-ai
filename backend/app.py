# backend/app.py
import sys
import os
from pathlib import Path
import json
import uuid
import pickle
from datetime import datetime

import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import firestore

from config import Config
from firebase_client import FirebaseClient
from agents.student_model import StudentModel
from agents.answer_evaluator import AnswerEvaluator

from recommenders.base_recommender import BaseRecommender
from recommenders.knn_recommender import KNNByS
from recommenders.svd_recommender import SVDRecommender
from recommenders.random_forest_rec import RandomForestRecommender

from llm.dialo_gpt_rag import DialoGPTRAGLLM
from rag_engine import RAGEngine

sys.path.insert(0, str(Path(__file__).parent))

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

firebase_client = FirebaseClient()
evaluator = AnswerEvaluator()
student_model = StudentModel()

QUESTION_BANK = {}
RESOURCES_CATALOG = {}

recommenders = {'knn': None, 'svd': None, 'rf': None}

rag_engine = RAGEngine()
llm_chat = None

active_sessions = {}
chat_histories = {}

# ----------------------------------------------------------------
# Carga inicial
# ----------------------------------------------------------------
def load_question_bank():
    global QUESTION_BANK
    path = os.path.join(Path(__file__).parent, app.config['QUESTION_BANK_PATH'])
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            QUESTION_BANK = json.load(f)
        print(f"Question bank loaded: {sum(len(v) for v in QUESTION_BANK.values())} questions")
    else:
        print(f"WARN: Question bank not found at {path}")
        QUESTION_BANK = {"polinomios": [{"id": "POL-01", "type": "Procedural", "difficulty": "Easy", "question": "Simplifica: (3x² + 2x) + (5x² − 7x)", "answer": "8x² − 5x", "resource_id": "REC-POL-01"}]}

def load_resources_catalog():
    global RESOURCES_CATALOG
    path = os.path.join(Path(__file__).parent, '..', 'data', 'resources.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        catalog = {}
        for rec_id, rec in raw.items():
            topic = rec.get('topic')
            if not topic:
                continue
            if topic not in catalog:
                catalog[topic] = []
            catalog[topic].append({
                'id': rec_id,
                'title': rec.get('title', rec_id),
                'url': rec.get('url', '#'),
                'format': rec.get('format', 'text'),
                'difficulty': rec.get('difficulty', 'Medium'),
                'description': rec.get('description', '')
            })
        RESOURCES_CATALOG = catalog
        print(f"Resources catalog loaded: {sum(len(v) for v in catalog.values())} resources")
    else:
        print(f"WARN: resources.json not found at {path}")

def load_recommenders():
    for name, cls in [('knn', KNNByS), ('svd', SVDRecommender), ('rf', RandomForestRecommender)]:
        path = os.path.join(app.config['MODELS_DIR'], f'{name}_model.pkl')
        if os.path.exists(path):
            with open(path, 'rb') as f:
                recommenders[name] = pickle.load(f)
            print(f"Loaded {name} recommender")
        else:
            print(f"Model {name} not found, will use static fallback")

def init_llm():
    global llm_chat
    try:
        llm_chat = DialoGPTRAGLLM(rag_engine=rag_engine)
        print("✅ DialoGPT-RAG cargado (único modelo conversacional)")
    except Exception as e:
        print(f"❌ Error cargando DialoGPT-RAG: {e}")
        llm_chat = None

# ----------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------
def pick_question(topic, S, used_ids, mode='adaptive'):
    pool = QUESTION_BANK.get(topic, [])
    if not pool:
        return None
    available = [q for q in pool if q['id'] not in used_ids]
    if not available:
        available = pool
    if mode == 'baseline':
        return available[0] if available else None
    target_diff = student_model.get_target_difficulty(S)
    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
    available.sort(key=lambda q: abs(diff_order.get(q.get('difficulty', 'Medium'), 1) - diff_order[target_diff]))
    return available[0] if available else None

def find_question_by_id(qid):
    for topic, questions in QUESTION_BANK.items():
        for q in questions:
            if q.get('id') == qid:
                q = q.copy()
                q['topic'] = topic
                return q
    return None

def build_questions_df():
    """Construye un DataFrame con todas las preguntas para los recomendadores."""
    rows = []
    for topic, questions in QUESTION_BANK.items():
        for q in questions:
            q_copy = q.copy()
            q_copy['topic'] = topic
            rows.append(q_copy)
    return pd.DataFrame(rows)

# ----------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'question_bank_loaded': len(QUESTION_BANK) > 0,
        'recommenders_loaded': [name for name, m in recommenders.items() if m is not None],
        'llm_available': llm_chat is not None
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
    return jsonify({'session_id': session_id, 'first_question': question})

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
    if user_answer.lower().strip() in ('ver respuesta', 'no sé', 'no se', 'respuesta'):
        result = {'is_correct': False, 'explanation': f"La respuesta correcta es: {question['answer']}. Te sugiero estudiar el recurso asociado.", 'method': 'direct-answer'}
    else:
        result = evaluator.evaluate(user_answer, question['answer'], question.get('type', 'Procedural'))
    old_S = session['S']
    self_level = 'mid'
    if uid:
        user = firebase_client.get_user(uid)
        if user and 'selfLevel' in user:
            self_level = user['selfLevel']
    new_S = student_model.update(old_S, result['is_correct'], response_time, self_level)
    session['S'] = new_S
    session['questions'].append({'question_id': question_id, 'correct': result['is_correct'], 'time_spent': response_time, 'S_before': old_S, 'S_after': new_S})
    try:
        firebase_client.save_interaction({'uid': uid, 'session_id': session_id, 'topic': session['topic'], 'question_id': question_id, 'difficulty': question.get('difficulty'), 'type': question.get('type'), 'pilotMode': session['mode'], 'userMsg': user_answer, 'correct': result['is_correct'], 'S_after': new_S, 'createdAt': firestore.SERVER_TIMESTAMP})
    except Exception as e:
        print(f"Error saving interaction: {e}")
    used = session['used_questions']
    used.add(question_id)
    next_question = pick_question(session['topic'], new_S, used, session['mode'])
    resource = {'title': f"Recurso: {question.get('id', '')}", 'url': '#', 'type': question.get('type', '')}
    rid = question.get('resource_id')
    if rid and RESOURCES_CATALOG:
        for topic_resources in RESOURCES_CATALOG.values():
            for r in topic_resources:
                if r['id'] == rid:
                    resource = {
                        'title': r['title'],
                        'url': r['url'],
                        'type': r['format'],
                        'description': r['description']
                    }
                    break
            else:
                continue
            break
    tier = student_model.get_tier(new_S)
    explanation = f"Tu precisión actual es {new_S['a']:.2f} (nivel: {tier}). Has respondido {'correctamente' if result['is_correct'] else 'incorrectamente'} a esta pregunta de dificultad {question.get('difficulty', 'Medium')} en {question.get('topic', session['topic'])}."
    return jsonify({'is_correct': result['is_correct'], 'explanation': result['explanation'], 'S_new': new_S, 'next_question': next_question, 'resource': resource, 'xai_explanation': explanation})

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
    metrics = {'session_id': session_id, 'topic': session['topic'], 'topicLabel': session.get('topicLabel', session['topic']), 'totalQuestions': total, 'correctCount': correct, 'incorrectCount': total - correct, 'accuracy': round(accuracy, 2), 'totalTimeSec': round(total_time, 1), 'avgTimeSec': round(total_time / total, 1) if total else 0, 'suggestedPath': 'Seguir practicando para mejorar la precisión.', 'S_end': session['S']}
    try:
        firebase_client.save_session({'sessionId': session_id, 'uid': session['uid'], 'topic': session['topic'], 'topicLabel': session.get('topicLabel', ''), 'pilotMode': session['mode'], 'pilotRunId': 'pilot_final_2026_05', 'startedAt': session['start_time'], 'endedAt': firestore.SERVER_TIMESTAMP, 'totalQuestions': total, 'correctCount': correct, 'accuracy': accuracy, 'totalTimeSec': total_time, 'questions': questions})
    except Exception as e:
        print(f"Error saving session: {e}")
    return jsonify(metrics)

# --- ENDPOINT DE RECURSOS DE ESTUDIO ---
@app.route('/api/resources', methods=['POST'])
def get_study_resources():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    if not topic:
        return jsonify({'error': 'Topic required'}), 400

    S = data.get('S')
    if not S and uid:
        user = firebase_client.get_user(uid)
        if user and 'S' in user:
            S = user['S']
    if not S:
        S = student_model.initial_state('mid')

    target_diff = student_model.get_target_difficulty(S)
    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}

    resources_pool = RESOURCES_CATALOG.get(topic, [])
    if not resources_pool:
        return jsonify({'resources': []})

    resources_pool.sort(key=lambda r: abs(diff_order.get(r['difficulty'], 'Medium') - diff_order[target_diff]))

    prefs = []
    if uid:
        user = firebase_client.get_user(uid)
        if user:
            prefs = user.get('preferences', [])
    pref_to_format = {
        'video': 'interactive', 'exercises': 'interactive',
        'text': 'text', 'examples': 'interactive', 'formulas': 'text'
    }
    allowed_formats = [pref_to_format[p] for p in prefs if p in pref_to_format]
    if allowed_formats:
        filtered = [r for r in resources_pool if r['format'] in allowed_formats]
        if filtered:
            resources_pool = filtered

    return jsonify({'resources': resources_pool[:4]})

# --- ENDPOINT RECOMMEND (USA MODELOS) ---
@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    mode = data.get('mode', 'adaptive')
    S = data.get('S')
    model_name = request.args.get('model', 'knn')
    if not S and uid:
        user = firebase_client.get_user(uid)
        if user and 'S' in user:
            S = user['S']
    if not S:
        S = student_model.initial_state()

    model = recommenders.get(model_name)
    resources = []
    model_used = 'static'
    questions_df = build_questions_df()

    if model:
        try:
            if model_name == 'knn':
                recommended_ids = model.recommend(S, topic, questions_df, top_n=3)
            elif model_name == 'svd':
                # SVD necesita un uid; usamos el real o un dummy
                svd_uid = uid or 'dummy'
                recommended_ids = model.recommend(svd_uid, topic, questions_df, top_n=3)
            elif model_name == 'rf':
                recommended_ids = model.recommend(S, topic, questions_df, top_n=3)
            else:
                recommended_ids = []

            for qid in recommended_ids:
                q = find_question_by_id(qid)
                if q:
                    resources.append({
                        'id': qid,
                        'title': q['question'][:60],
                        'url': q.get('resource_id', '#'),  # aquí conviene mostrar el título del recurso luego
                        'type': q.get('type', ''),
                        'justification': f"Recomendado por modelo {model_name.upper()} porque tu precisión ({S['a']:.2f}) y nivel ({student_model.get_tier(S)}) indican que este recurso es adecuado."
                    })
            model_used = model_name
        except Exception as e:
            print(f"Recommender {model_name} failed: {e}")

    if len(resources) < 3:
        pool = QUESTION_BANK.get(topic, [])
        for q in pool:
            if len(resources) >= 3:
                break
            if not any(r['id'] == q['id'] for r in resources):
                resources.append({
                    'id': q['id'],
                    'title': q['question'][:60],
                    'url': q.get('resource_id', '#'),
                    'type': q.get('type', ''),
                    'justification': f"Recurso del tema {topic} para reforzar conceptos."
                })

    # Filtro por preferencias
    prefs = []
    if uid:
        user = firebase_client.get_user(uid)
        if user:
            prefs = user.get('preferences', [])
    if prefs and RESOURCES_CATALOG:
        pref_to_format = {
            'video': 'interactive', 'exercises': 'interactive',
            'text': 'text', 'examples': 'interactive', 'formulas': 'text'
        }
        allowed = [pref_to_format[p] for p in prefs if p in pref_to_format]
        if allowed:
            filtered = []
            for r in resources:
                # Buscar el formato del recurso asociado (si tiene resource_id)
                res_id = r.get('url')  # temporal, realmente deberíamos buscar por qid -> resource_id
                # mejor buscar por el id de pregunta
                q = find_question_by_id(r['id'])
                if q and q.get('resource_id'):
                    rid = q['resource_id']
                    for topic_res in RESOURCES_CATALOG.values():
                        for rec in topic_res:
                            if rec['id'] == rid and rec['format'] in allowed:
                                filtered.append(r)
                                break
            if filtered:
                resources = filtered

    return jsonify({'resources': resources[:3], 'model_used': model_used})

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
    global llm_chat
    data = request.get_json()
    message = data.get('message', '')
    uid = data.get('uid')
    S = data.get('S')
    topic = data.get('topic')
    chat_session_id = data.get('chat_session_id')

    if not chat_session_id:
        chat_session_id = f"chat_{uuid.uuid4().hex[:12]}"

    if llm_chat is None:
        return jsonify({'reply': 'El tutor aún no está listo. Intenta en unos segundos.', 'chat_session_id': chat_session_id}), 503

    history = chat_histories.get(chat_session_id, [])
    context = {'uid': uid, 'S': S, 'topic': topic, 'mode': data.get('mode', 'adaptive'), 'chat_history': history}

    try:
        reply = llm_chat.generate(message, context)
    except Exception as e:
        print(f"Error en chat: {e}")
        reply = "Lo siento, ocurrió un error. Por favor intenta de nuevo."

    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply})
    if len(history) > 10:
        history = history[-10:]
    chat_histories[chat_session_id] = history

    return jsonify({'reply': reply, 'model_used': llm_chat.name(), 'chat_session_id': chat_session_id})

@app.route('/api/chat/reset', methods=['POST'])
def chat_reset():
    data = request.get_json()
    chat_session_id = data.get('chat_session_id')
    if not chat_session_id:
        return jsonify({'error': 'chat_session_id required'}), 400
    if chat_session_id in chat_histories:
        del chat_histories[chat_session_id]
    return jsonify({'status': 'reset', 'chat_session_id': chat_session_id})

@app.route('/api/models/status', methods=['GET'])
def models_status():
    return jsonify({
        'recommenders_available': [name for name, m in recommenders.items() if m is not None],
        'llm_available': llm_chat is not None,
        'question_bank_size': sum(len(v) for v in QUESTION_BANK.values())
    })

# ----------------------------------------------------------------
# Inicio
# ----------------------------------------------------------------
if __name__ == '__main__':
    load_question_bank()
    if QUESTION_BANK:
        rag_engine.index_questions(QUESTION_BANK)
    load_resources_catalog()
    os.makedirs(app.config['MODELS_DIR'], exist_ok=True)
    load_recommenders()
    init_llm()
    app.run(debug=app.config['DEBUG'], host=app.config['HOST'], port=app.config['PORT'])