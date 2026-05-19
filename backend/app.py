# backend/app.py
import sys
import os
from pathlib import Path
import json
import uuid
import pickle
from datetime import datetime

import numpy as np
import joblib
from scipy.sparse import hstack
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import firestore

from config import Config
from firebase_client import FirebaseClient
from agents.student_model import StudentModel
from agents.answer_evaluator import AnswerEvaluator

from llm.dialo_gpt_rag import DialoGPTRAGLLM
from rag_engine import RAGEngine

# ============================================================
# Definición de la clase ContextualRecommender
# ============================================================
class ContextualRecommender:
    def __init__(self, regressor, topic_enc, diff_enc, item_type_enc, intent_enc, feature_columns):
        self.regressor = regressor
        self.topic_enc = topic_enc
        self.diff_enc = diff_enc
        self.item_type_enc = item_type_enc
        self.intent_enc = intent_enc
        self.feature_columns = feature_columns

    def recommend(self, uid, topic, intent, mastery, streak, items_df, n=5):
        if intent in ["EXPLAIN", "DOUBT"]:
            filtered = items_df[items_df["item_type"] == "resource"]
        elif intent in ["PRACTICE", "QUIZ"]:
            filtered = items_df[items_df["item_type"] == "question"]
        else:
            filtered = items_df.copy()

        filtered = filtered[filtered["topic"] == topic]
        if filtered.empty:
            return []

        X = filtered.copy()
        X["topic_enc"] = self.topic_enc.transform(X["topic"])
        X["difficulty_enc"] = self.diff_enc.transform(X["difficulty"])
        X["item_type_enc"] = self.item_type_enc.transform(X["item_type"])
        X["mastery_before"] = mastery
        X["streak_before"] = streak
        intent_enc = self.intent_enc.transform([intent])[0]
        X["intent_enc"] = intent_enc

        scores = self.regressor.predict(X[self.feature_columns])
        X["score"] = scores
        return X.nlargest(n, "score")["item_id"].tolist()

# ----------------------------------------------------------------
# Inicialización de Flask
# ----------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config.from_object(Config)

firebase_client = FirebaseClient()
evaluator = AnswerEvaluator()
student_model = StudentModel()

QUESTION_BANK = {}
RESOURCES_CATALOG = {}

best_recommender = None

rag_engine = RAGEngine()
llm_chat = None

active_sessions = {}
chat_histories = {}

nlp_pipeline = None

# ----------------------------------------------------------------
# Carga de datos y modelos
# ----------------------------------------------------------------
def load_question_bank():
    global QUESTION_BANK
    path = os.path.join(Path(__file__).parent, app.config['QUESTION_BANK_PATH'])
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        if isinstance(raw, dict):
            first_key = next(iter(raw))
            first_val = raw[first_key]
            if isinstance(first_val, dict) and 'topic' in first_val:
                grouped = {}
                for q in raw.values():
                    topic = q.get('topic')
                    if not topic:
                        continue
                    if topic not in grouped:
                        grouped[topic] = []
                    grouped[topic].append(q)
                QUESTION_BANK = grouped
            else:
                QUESTION_BANK = raw
        else:
            QUESTION_BANK = raw
        print(f"Question bank loaded: {sum(len(v) for v in QUESTION_BANK.values())} questions")
    else:
        print(f"WARN: Question bank not found at {path}")
        
    print("Preguntas por tema:")
    for topic, qlist in QUESTION_BANK.items():
        print(f"  {topic}: {len(qlist)} preguntas")

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

def load_best_recommender():
    global best_recommender
    comp_path = os.path.join(Path(__file__).parent.parent, 'models', 'Recommenders', 'results', 'recommender_components.pkl')
    if os.path.exists(comp_path):
        with open(comp_path, 'rb') as f:
            comp = pickle.load(f)
        best_recommender = ContextualRecommender(
            comp['regressor'],
            comp['topic_enc'],
            comp['diff_enc'],
            comp['item_type_enc'],
            comp['intent_enc'],
            comp['feature_columns']
        )
        print("✅ Mejor recomendador contextual cargado")
    else:
        print("⚠️ No se encontró recommender_components.pkl, usando fallback estático")

def build_full_items_df():
    rows = []
    for topic, questions in QUESTION_BANK.items():
        for q in questions:
            rows.append({
                'item_id': q['id'],
                'topic': topic,
                'difficulty': q.get('difficulty', 'Medium'),
                'item_type': 'question'
            })
    for topic, resources in RESOURCES_CATALOG.items():
        for r in resources:
            rows.append({
                'item_id': r['id'],
                'topic': topic,
                'difficulty': r.get('difficulty', 'Medium'),
                'item_type': 'resource'
            })
    return pd.DataFrame(rows)

def init_llm():
    global llm_chat
    try:
        llm_chat = DialoGPTRAGLLM(rag_engine=rag_engine)
        print("✅ DialoGPT-RAG cargado")
    except Exception as e:
        print(f"❌ Error cargando DialoGPT-RAG: {e}")
        llm_chat = None

def load_nlp_model():
    global nlp_pipeline
    nlp_model_path = os.path.join(Path(__file__).parent.parent, 'models', 'NLP', 'results', 'best_nlp_model.pkl')
    if os.path.exists(nlp_model_path):
        try:
            nlp_pipeline = joblib.load(nlp_model_path)
            print("✅ Modelo NLP cargado")
        except Exception as e:
            print(f"❌ Error cargando modelo NLP: {e}")
            nlp_pipeline = None
    else:
        print(f"⚠️ Modelo NLP no encontrado en {nlp_model_path}")
        nlp_pipeline = None

# ----------------------------------------------------------------
# Funciones auxiliares
# ----------------------------------------------------------------
def pick_question(topic, S, used_ids, mode='adaptive'):
    import random
    pool = QUESTION_BANK.get(topic, [])
    print(f"Buscando preguntas para {topic}: {len(pool)} disponibles")
    if not pool:
        return None
    available = [q for q in pool if q['id'] not in used_ids]
    if not available:
        available = pool[:]
    if mode == 'baseline':
        return random.choice(available)
    target_diff = student_model.get_target_difficulty(S, topic=topic)
    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
    target_num = diff_order.get(target_diff, 1)
    same_diff = [q for q in available if diff_order.get(q.get('difficulty', 'Medium'), 1) == target_num]
    if same_diff:
        return random.choice(same_diff)
    min_dist = min(abs(diff_order.get(q.get('difficulty', 'Medium'), 1) - target_num) for q in available)
    closest = [q for q in available if abs(diff_order.get(q.get('difficulty', 'Medium'), 1) - target_num) == min_dist]
    return random.choice(closest)

def find_question_by_id(qid):
    for topic, questions in QUESTION_BANK.items():
        for q in questions:
            if q.get('id') == qid:
                q = q.copy()
                q['topic'] = topic
                return q
    return None

def find_resource_by_id(rid):
    for topic, resources in RESOURCES_CATALOG.items():
        for r in resources:
            if r['id'] == rid:
                return r
    return None

def update_mastery_for_topic(S, topic, delta):
    """Aplica un delta (ej. +0.05) al mastery del tema en el vector S."""
    if isinstance(S, list):
        for t in S:
            if t.get('topic') == topic:
                new_mastery = t.get('mastery', 0.5) + delta
                t['mastery'] = max(0.0, min(1.0, new_mastery))
                break
    elif isinstance(S, dict) and 'a_temas' in S:
        if topic in S['a_temas']:
            old = S['a_temas'][topic].get('mastery', 0.5)
            new_mastery = old + delta
            S['a_temas'][topic]['mastery'] = max(0.0, min(1.0, new_mastery))
    return S

def calcular_global_mastery(S_vector):
    """
    Calcula el mastery global ponderado a partir del vector S.
    Da más peso a los temas con menor dominio.
    Soporta dos formatos:
    - Lista: [{'topic': 'polinomios', 'mastery': 0.7}, ...]
    - Dict: {'a_temas': {'polinomios': {'mastery': 0.7}, ...}}
    """
    # Convertir formato lista a dict con a_temas
    if isinstance(S_vector, list):
        # Si la lista está vacía, retornar 0
        if not S_vector:
            return 0.0
        # Construir el dict interno
        temas_dict = {}
        for tema in S_vector:
            topic = tema.get('topic')
            mastery = tema.get('mastery', 0.5)
            if topic:
                temas_dict[topic] = {'mastery': mastery}
        S_vector = {'a_temas': temas_dict}
    
    # Ahora S_vector debe ser dict con 'a_temas'
    temas = S_vector.get('a_temas', {})
    if not temas:
        return 0.0
    
    numerador = 0.0
    denominador = 0.0
    for datos in temas.values():
        if isinstance(datos, dict):
            m = datos.get('mastery', 0)
        else:
            m = float(datos) if isinstance(datos, (int, float)) else 0
        # Peso inverso: menor mastery, mayor peso
        peso = 1 - m
        numerador += peso * m
        denominador += peso
    
    if denominador == 0:
        return 0.0
    return numerador / denominador

# ----------------------------------------------------------------
# NLP helper
# ----------------------------------------------------------------
def predict_intent_topic(texto_usuario, current_topic=None, umbral_confianza=0.35):
    if nlp_pipeline is None:
        return 'UNKNOWN', 'none', 0.0

    msg_lower = texto_usuario.lower().strip()

    gracias_words = ['gracias', 'graciass', 'agradezco', 'thanks', 'ty', 'grax']
    goodbye_words = ['chao', 'adios', 'bye', 'nos vemos', 'hasta luego', 'me voy',
                     'hasta mañana', 'terminé', 'termine', 'me despido', 'cuidate']
    greeting_words = ['hola', 'buenas', 'hey', 'alo', 'saludos', 'buen día', 'buen dia',
                      'buenas tardes', 'buenas noches', 'que tal', 'cómo vas', 'como vas']
    casual_words = ['xd', 'jaja', 'jeje', 'lol', 'toy cansao', 'que pereza', 'me aburro',
                    'no quiero estudiar', 'tengo sueño', 'me duele la cabeza',
                    'que flojera', 'me estreso', 'ayuda que no entiendo nada']

    if any(w in msg_lower for w in greeting_words) and len(msg_lower.split()) <= 5:
        return 'GREETING', 'social', 1.0
    if any(w in msg_lower for w in goodbye_words) and len(msg_lower.split()) <= 5:
        return 'GOODBYE', 'social', 1.0
    if any(w in msg_lower for w in gracias_words) and len(msg_lower.split()) <= 6:
        return 'THANKS', 'social', 1.0
    if any(w in msg_lower for w in casual_words):
        return 'CASUAL', 'social', 1.0
    if len(msg_lower) < 3 or msg_lower.replace('?','').replace('!','').replace('.','').strip() == '':
        return 'UNKNOWN', 'none', 1.0

    study_keywords = [
        'estudiar', 'estudio', 'estudiar teoría', 'ver teoría', 'recursos',
        'explicar', 'explicación', 'quiero estudiar', 'necesito estudiar',
        'estudiar el tema', 'ver recursos', 'dame recursos',
        'material de estudio', 'teoría', 'aprender', 'leer',
        'necesito teoría', 'quiero teoría', 'ver material'
    ]
    practice_keywords = [
        'practicar', 'practica', 'ejercicios', 'hacer ejercicios',
        'práctica', 'quiz', 'quiero practicar', 'necesito practicar',
        'test', 'preguntas', 'empezar práctica', 'comenzar práctica',
        'hacer test', 'tomar quiz'
    ]

    if any(kw in msg_lower for kw in study_keywords):
        return 'EXPLAIN', current_topic if current_topic else 'none', 1.0
    if any(kw in msg_lower for kw in practice_keywords):
        return 'PRACTICE', current_topic if current_topic else 'none', 1.0

    preprocessor = nlp_pipeline['preprocessor']
    word_vectorizer = nlp_pipeline['word_vectorizer']
    char_vectorizer = nlp_pipeline['char_vectorizer']
    model_intent = nlp_pipeline['model_intent']
    model_topic = nlp_pipeline['model_topic']
    intent_classes = nlp_pipeline['intent_classes']
    topic_classes = nlp_pipeline['topic_classes']

    texto_limpio = preprocessor.transform([texto_usuario])
    X_word = word_vectorizer.transform(texto_limpio)
    X_char = char_vectorizer.transform(texto_limpio)
    X_final = hstack([X_word, X_char])

    def get_probs(model, X):
        if hasattr(model, "predict_proba"):
            return model.predict_proba(X)[0]
        else:
            scores = model.decision_function(X)[0]
            probs = np.exp(scores) / np.sum(np.exp(scores))
            return probs

    intent_probs = get_probs(model_intent, X_final)
    idx_max = np.argmax(intent_probs)
    max_prob = intent_probs[idx_max]
    intent_detectado = intent_classes[idx_max]

    if max_prob < 0.4:
        if any(w in msg_lower for w in gracias_words):
            return 'THANKS', 'social', max_prob
        if any(w in msg_lower for w in greeting_words):
            return 'GREETING', 'social', max_prob
        if any(w in msg_lower for w in goodbye_words):
            return 'GOODBYE', 'social', max_prob
        if max_prob < umbral_confianza:
            return 'AMBIGUOUS', 'none', float(max_prob)

    intents_sociales = {"GREETING", "GOODBYE", "CASUAL", "ABOUT", "THANKS"}
    if intent_detectado in intents_sociales:
        topic_detectado = 'social'
    else:
        topic_probs = get_probs(model_topic, X_final)
        idx_topic = np.argmax(topic_probs)
        topic_detectado = topic_classes[idx_topic]

    return intent_detectado, topic_detectado, float(max_prob)

# ----------------------------------------------------------------
# Función para obtener recomendaciones en el chat
# ----------------------------------------------------------------
def get_recommendations_for_chat(uid, topic, intent, S, n=3):
    if best_recommender is None:
        return []
    mastery = 0.5
    streak = 0
    if isinstance(S, list):
        for t in S:
            if t.get('topic') == topic:
                mastery = t.get('mastery', 0.5)
                streak = t.get('streak', 0)
                break
    elif isinstance(S, dict) and 'a_temas' in S:
        tema = S['a_temas'].get(topic, {})
        mastery = tema.get('mastery', 0.5)
        streak = tema.get('streak', 0)
    items_df = build_full_items_df()
    try:
        recommended_ids = best_recommender.recommend(
            uid, topic, intent, mastery, streak, items_df, n=n
        )
        resources = []
        for item_id in recommended_ids:
            q = find_question_by_id(item_id)
            if q:
                resources.append({
                    'id': item_id,
                    'title': q.get('question', '')[:100],
                    'type': 'question',
                    'difficulty': q.get('difficulty'),
                    'justification': f"Recomendado según tu dominio ({mastery:.2f})"
                })
            else:
                r = find_resource_by_id(item_id)
                if r:
                    resources.append({
                        'id': item_id,
                        'title': r['title'],
                        'url': r['url'],
                        'type': 'resource',
                        'difficulty': r.get('difficulty'),
                        'justification': f"Recurso sugerido para {intent}"
                    })
        return resources[:n]
    except Exception as e:
        print(f"Error en recomendador desde chat: {e}")
        return []

# ----------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'question_bank_loaded': len(QUESTION_BANK) > 0,
        'recommender_loaded': best_recommender is not None,
        'llm_available': llm_chat is not None,
        'nlp_model_available': nlp_pipeline is not None
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
        'used_questions': set(),
        'max_questions': 3,
        'question_count': 0
    }
    question = pick_question(topic, S, set(), mode)
    print(f"DEBUG: Primera pregunta para {topic}: {question}")
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
    if uid:
        firebase_client.update_user_S(uid, new_S)
    session['questions'].append({'question_id': question_id, 'correct': result['is_correct'], 'time_spent': response_time, 'S_before': old_S, 'S_after': new_S})
    try:
        firebase_client.save_interaction({'uid': uid, 'session_id': session_id, 'topic': session['topic'], 'question_id': question_id, 'difficulty': question.get('difficulty'), 'type': question.get('type'), 'pilotMode': session['mode'], 'userMsg': user_answer, 'correct': result['is_correct'], 'S_after': new_S, 'createdAt': firestore.SERVER_TIMESTAMP})
    except Exception as e:
        print(f"Error saving interaction: {e}")
    used = session['used_questions']
    used.add(question_id)
    session['question_count'] = session.get('question_count', 0) + 1
    max_q = session.get('max_questions', 3)
    if session['question_count'] >= max_q:
        next_question = None
    else:
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
    if isinstance(new_S, list):
        topic_key = question.get('topic', session['topic'])
        topic_data = next((t for t in new_S if t.get('topic') == topic_key), {})
        _s_for_tier = {'a': topic_data.get('mastery', 0.5)}
    else:
        _s_for_tier = new_S
    tier = student_model.get_tier(_s_for_tier)
    mastery_val = topic_data.get('mastery', 0.5) if isinstance(new_S, list) else new_S.get('a', 0.5)
    topic_key = question.get('topic', session['topic'])
    explanation = f"Tu precisión actual es {mastery_val:.2f} (nivel: {tier}). Has respondido {'correctamente' if result['is_correct'] else 'incorrectamente'} a esta pregunta de dificultad {question.get('difficulty', 'Medium')} en {topic_key}."
    return jsonify({
        'is_correct': result['is_correct'],
        'explanation': result['explanation'],
        'S_new': new_S,
        'next_question': next_question,
        'resource': resource,
        'xai_explanation': explanation,
        'session_complete': next_question is None
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
    uid = session.get('uid')
    if uid:
        firebase_client.update_user_S(uid, session['S'])
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
        'S_end': session['S']   # ✅ nombre corregido
    }
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
            'questions': questions,
            'S_end': session['S']   # ✅ también aquí
        })
    except Exception as e:
        print(f"Error saving session: {e}")
    return jsonify(metrics)

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
    target_diff = student_model.get_target_difficulty(S, topic=topic)
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

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    intent = data.get('intent', 'PRACTICE')
    S = data.get('S')
    if not topic:
        return jsonify({'error': 'Topic required'}), 400
    if not S and uid:
        user = firebase_client.get_user(uid)
        if user and 'S' in user:
            S = user['S']
    if not S:
        S = student_model.initial_state('mid')
    mastery = 0.5
    streak = 0
    if isinstance(S, list):
        for t in S:
            if t.get('topic') == topic:
                mastery = t.get('mastery', 0.5)
                streak = t.get('streak', 0)
                break
    elif isinstance(S, dict) and 'a_temas' in S:
        tema = S['a_temas'].get(topic, {})
        mastery = tema.get('mastery', 0.5)
        streak = tema.get('streak', 0)
    resources = []
    model_used = 'static'
    if best_recommender:
        items_df = build_full_items_df()
        try:
            recommended_ids = best_recommender.recommend(
                uid, topic, intent, mastery, streak, items_df, n=5
            )
            for item_id in recommended_ids:
                q = find_question_by_id(item_id)
                if q:
                    resources.append({
                        'id': item_id,
                        'title': q.get('question', '')[:80],
                        'type': 'question',
                        'difficulty': q.get('difficulty'),
                        'justification': f"Recomendado por IA según tu dominio ({mastery:.2f}) y la intención {intent}"
                    })
                else:
                    r = find_resource_by_id(item_id)
                    if r:
                        resources.append({
                            'id': item_id,
                            'title': r['title'],
                            'url': r['url'],
                            'type': 'resource',
                            'difficulty': r.get('difficulty'),
                            'justification': f"Recurso sugerido por IA para {intent} (dominio {mastery:.2f})"
                        })
            model_used = 'ContextualRecommender'
        except Exception as e:
            print(f"Error en recomendador: {e}")
    if len(resources) < 3:
        pool = QUESTION_BANK.get(topic, []) + RESOURCES_CATALOG.get(topic, [])
        for item in pool:
            if len(resources) >= 3:
                break
            if not any(r['id'] == item['id'] for r in resources):
                resources.append({
                    'id': item['id'],
                    'title': item.get('question', item.get('title', ''))[:80],
                    'type': 'question' if 'question' in item else 'resource',
                    'difficulty': item.get('difficulty', 'Medium'),
                    'justification': f"Complemento estático del tema {topic}"
                })
    return jsonify({
        'resources': resources[:3],
        'model_used': model_used,
        'intent_used': intent,
        'mastery': mastery
    })

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.get_json()
    uid = data.get('uid')
    topic = data.get('topic')
    useful = data.get('useful', False)
    too_easy = data.get('too_easy', False)
    too_hard = data.get('too_hard', False)
    try:
        # Guardar feedback original
        firebase_client.save_feedback({
            'uid': uid,
            'sessionId': data.get('session_id'),
            'topic': topic,
            'questionId': data.get('question_id'),
            'useful': useful,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        # Actualizar mastery según feedback
        if useful or too_easy:
            delta = +0.05
        elif too_hard:
            delta = -0.05
        else:
            delta = 0
        if delta != 0 and uid and topic:
            user = firebase_client.get_user(uid)
            if user and 'S' in user:
                S = user['S']
                S = update_mastery_for_topic(S, topic, delta)
                firebase_client.update_user_S(uid, S)
                # Si hay sesión activa, actualizarla también
                for sess_id, sess in active_sessions.items():
                    if sess.get('uid') == uid:
                        sess['S'] = update_mastery_for_topic(sess['S'], topic, delta)
                # Devolver el nuevo S en la respuesta
                return jsonify({'status': 'ok', 'S': S})
        return jsonify({'status': 'ok'})
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
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
    intent, detected_topic, conf = predict_intent_topic(message, topic)
    final_topic = detected_topic if detected_topic != 'social' and conf > 0.35 else topic
    if intent == 'AMBIGUOUS':
        return jsonify({
            'reply': "No logré comprender del todo tu solicitud. ¿Podrías reformularla?",
            'intent': intent,
            'topic': 'none',
            'confidence': conf,
            'chat_session_id': chat_session_id
        })
    social_responses = {
        "GREETING": "¡Hola! ¿En qué tema te ayudo hoy?",
        "GOODBYE": "¡Hasta luego! Sigue practicando.",
        "THANKS": "¡De nada! Estoy aquí para ayudarte.",
        "CASUAL": "😊 ¿Quieres que practiquemos algún tema?"
    }
    if intent in social_responses:
        return jsonify({
            'reply': social_responses[intent],
            'intent': intent,
            'topic': final_topic,
            'confidence': conf,
            'chat_session_id': chat_session_id
        })

    # Respuestas académicas con recomendador
    if intent in ('EXPLAIN', 'DOUBT', 'PRACTICE', 'QUIZ'):
        topic_to_use = final_topic if final_topic not in ('social','none') else (topic or 'polinomios')
        recommended_resources = get_recommendations_for_chat(uid, topic_to_use, intent, S, n=3)

        if intent in ('EXPLAIN','DOUBT'):
            reply_text = f"📚 He preparado estos recursos para que estudies **{topic_to_use}** según tu perfil:\n"
            if recommended_resources:
                lines = []
                for idx, res in enumerate(recommended_resources, 1):
                    if res['type'] == 'question':
                        lines.append(f"{idx}. {res['title']}")
                    else:
                        url = res.get('url', '#')
                        lines.append(f"{idx}. [{res['title']}]({url})")
                reply_text += "\n".join(lines)
                reply_text += "\n\nCuando estudies el material, escribe **\"practicar\"** para realizar un pequeño cuestionario."
            else:
                reply_text = f"Lo siento, no encontré recursos para {topic_to_use}. Intenta más tarde."
        else:  # PRACTICE o QUIZ
            reply_text = f"✏️ De acuerdo, vamos a practicar **{topic_to_use}** con preguntas adaptadas a tu nivel.\n\nTe haré 3 preguntas. ¡Empecemos!"

        return jsonify({
            'reply': reply_text,
            'model_used': 'recommender',
            'intent': intent,
            'topic': topic_to_use,
            'confidence': 1.0,
            'resources': recommended_resources if intent in ('EXPLAIN','DOUBT') else [],
            'chat_session_id': chat_session_id
        })

    # Fallback a LLM
    if llm_chat is None:
        return jsonify({
            'reply': 'El tutor aún no está listo. Intenta en unos segundos.',
            'chat_session_id': chat_session_id
        }), 503

    history = chat_histories.get(chat_session_id, [])
    context = {
        'uid': uid,
        'S': S,
        'topic': final_topic,
        'intent': intent,
        'mode': data.get('mode', 'adaptive'),
        'chat_history': history
    }
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
    return jsonify({
        'reply': reply,
        'model_used': llm_chat.name(),
        'intent': intent,
        'topic': final_topic,
        'confidence': conf,
        'chat_session_id': chat_session_id
    })

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
        'recommender_available': best_recommender is not None,
        'llm_available': llm_chat is not None,
        'nlp_model_available': nlp_pipeline is not None,
        'question_bank_size': sum(len(v) for v in QUESTION_BANK.values())
    })

@app.route('/api/profile/<uid>', methods=['GET'])
def get_profile(uid):
    try:
        user = firebase_client.get_user(uid)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        name = user.get('name', 'Estudiante')
        prefs = user.get('preferences', []) or []
        S = user.get('S', None)

        # Lista completa de temas (10)
        all_topics = ["polinomios", "fracciones", "ecuaciones", "sistemas", "factorizacion",
                      "potencias", "radicales", "logaritmos", "funciones", "inecuaciones"]
        topic_mastery = {topic: 0.0 for topic in all_topics}
        
        if S:
            if isinstance(S, list):
                for t in S:
                    topic = t.get('topic')
                    mastery = t.get('mastery', 0)
                    if topic in topic_mastery:
                        topic_mastery[topic] = mastery
            elif isinstance(S, dict) and 'a_temas' in S:
                for topic, data in S['a_temas'].items():
                    if topic in topic_mastery:
                        topic_mastery[topic] = data.get('mastery', 0)
        
        # Calcular ruta crítica: temas con menor mastery
        sorted_topics = sorted(topic_mastery.items(), key=lambda x: x[1])
        critical_path = [{'topic': t, 'mastery': m} for t, m in sorted_topics[:3]]

        profile = {
            'name': name,
            'preferences': prefs,
            'critical_path': critical_path,
            'topic_mastery': topic_mastery
        }
        return jsonify(profile)
    except Exception as e:
        print(f"Error en perfil: {e}")
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------
# Inicio
# ----------------------------------------------------------------
if __name__ == '__main__':
    load_question_bank()
    if QUESTION_BANK:
        rag_engine.index_questions_if_empty(QUESTION_BANK)
    print("1. Cargando recursos...")
    load_resources_catalog()
    print("2. Creando directorio de modelos...")
    os.makedirs(app.config['MODELS_DIR'], exist_ok=True)
    print("3. Cargando recomendador...")
    load_best_recommender()
    print("4. Cargando LLM...")
    init_llm()
    print("5. Cargando NLP...")
    load_nlp_model()
    print("6. Iniciando servidor...")
    app.run(debug=app.config['DEBUG'], host=app.config['HOST'], port=app.config['PORT'])