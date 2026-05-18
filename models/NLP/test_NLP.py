import json
import os
import numpy as np
from sklearn.metrics import accuracy_score, classification_report
import joblib
from scipy.sparse import hstack

# ------------------------------------------------------------
# 1. Definir la raíz del proyecto (subimos dos niveles desde models/NLP)
# ------------------------------------------------------------
CURRENT_FILE = os.path.abspath(__file__)                       # models/NLP/test_NLP.py
MODELS_DIR = os.path.dirname(CURRENT_FILE)                     # models/NLP
PROJECT_ROOT = os.path.abspath(os.path.join(MODELS_DIR, "../.."))  # eduapt-ai/

# ------------------------------------------------------------
# 2. Cargar el pipeline entrenado
# ------------------------------------------------------------
MODEL_PATH = os.path.join(MODELS_DIR, "results", "best_nlp_model.pkl")
pipeline = joblib.load(MODEL_PATH)

# ------------------------------------------------------------
# 3. Función de predicción (idéntica a la de producción)
# ------------------------------------------------------------
def predecir_intent_y_topic(texto_usuario, umbral_confianza=0.35):
    texto_limpio = pipeline["preprocessor"].transform([texto_usuario])
    X_word = pipeline["word_vectorizer"].transform(texto_limpio)
    X_char = pipeline["char_vectorizer"].transform(texto_limpio)
    X_final = hstack([X_word, X_char])

    # Función auxiliar para obtener probabilidades (o pseudo-probabilidades)
    def get_probs(model, X):
        if hasattr(model, "predict_proba"):
            return model.predict_proba(X)[0]
        else:
            # Usar decision_function + softmax
            scores = model.decision_function(X)[0]
            # Softmax para convertir distancias en distribución de probabilidad
            probs = np.exp(scores) / np.sum(np.exp(scores))
            return probs

    intent_probs = get_probs(pipeline["model_intent"], X_final)
    idx_max_intent = np.argmax(intent_probs)
    max_intent_prob = intent_probs[idx_max_intent]

    if max_intent_prob < umbral_confianza:
        return "AMBIGUOUS", "none", float(max_intent_prob)

    intent_detectado = pipeline["intent_classes"][idx_max_intent]
    intents_sociales = {"GREETING", "GOODBYE", "CASUAL", "ABOUT", "THANKS"}
    if intent_detectado in intents_sociales:
        topic_detectado = "social"
    else:
        topic_probs = get_probs(pipeline["model_topic"], X_final)
        idx_max_topic = np.argmax(topic_probs)
        topic_detectado = pipeline["topic_classes"][idx_max_topic]

    return intent_detectado, topic_detectado, float(max_intent_prob)

# ------------------------------------------------------------
# 4. Cargar el dataset de prueba real (holdout)
# ------------------------------------------------------------
TEST_DATA_PATH = os.path.join(PROJECT_ROOT, "data", "nlp_test_real_data.json")
with open(TEST_DATA_PATH, "r", encoding="utf-8") as f:
    test_data = json.load(f)

# ------------------------------------------------------------
# 5. Evaluar cada frase y mostrar resultados
# ------------------------------------------------------------
y_true_intent = []
y_pred_intent = []
y_true_topic = []
y_pred_topic = []

print("=" * 60)
print("📊 EVALUACIÓN SOBRE SET DE PRUEBA REAL (HOLDOUT)")
print("=" * 60)

for entry in test_data:
    texto = entry["text"]
    true_intent = entry["intent"]
    true_topic = entry["topic"]

    pred_intent, pred_topic, conf = predecir_intent_y_topic(texto)

    y_true_intent.append(true_intent)
    y_pred_intent.append(pred_intent)
    y_true_topic.append(true_topic)
    y_pred_topic.append(pred_topic)

    status = "✅" if (pred_intent == true_intent and pred_topic == true_topic) else "❌"
    print(f"{status} \"{texto[:70]}...\"")
    print(f"   Real    -> intent: {true_intent:12} | topic: {true_topic}")
    print(f"   Pred.   -> intent: {pred_intent:12} | topic: {pred_topic} (conf: {conf:.3f})")
    print("-" * 50)

# ------------------------------------------------------------
# 6. Métricas globales
# ------------------------------------------------------------
print("\n" + "=" * 60)
print("🎯 MÉTRICAS DE INTENT")
print("=" * 60)
print(f"Accuracy: {accuracy_score(y_true_intent, y_pred_intent):.4f}")
print(classification_report(y_true_intent, y_pred_intent, zero_division=0))

print("\n" + "=" * 60)
print("📚 MÉTRICAS DE TÓPICO")
print("=" * 60)
print(f"Accuracy: {accuracy_score(y_true_topic, y_pred_topic):.4f}")
print(classification_report(y_true_topic, y_pred_topic, zero_division=0))