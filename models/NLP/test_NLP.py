# models/NLP/test_NLP.py
# Script de evaluación del modelo NLP sobre un conjunto de datos real de prueba (holdout).
# Carga el pipeline entrenado, predice sobre cada ejemplo, muestra accuracy y reportes de clasificación,
# y guarda todos los resultados en un archivo test_report.txt dentro de la carpeta results.

import json
import os
import sys
import numpy as np
from sklearn.metrics import accuracy_score, classification_report
import joblib
from scipy.sparse import hstack
from datetime import datetime

# ============================================================================
# CONFIGURACIÓN DE RUTAS
# ============================================================================
CURRENT_FILE = os.path.abspath(__file__)                     # models/NLP/test_NLP.py
MODELS_DIR = os.path.dirname(CURRENT_FILE)                   # models/NLP
PROJECT_ROOT = os.path.abspath(os.path.join(MODELS_DIR, "../.."))  # raíz del proyecto
RESULTS_DIR = os.path.join(MODELS_DIR, "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

# Rutas de archivos
MODEL_PATH = os.path.join(RESULTS_DIR, "best_nlp_model.pkl")
TEST_DATA_PATH = os.path.join(PROJECT_ROOT, "data", "nlp_test_real_data.json")
REPORT_PATH = os.path.join(RESULTS_DIR, "test_report.txt")

# Cargar modelo
print("Cargando modelo NLP...")
pipeline = joblib.load(MODEL_PATH)
print("Modelo cargado correctamente.\n")


# ============================================================================
# FUNCIÓN DE PREDICCIÓN (idéntica a la de producción)
# ============================================================================
def predecir_intent_y_topic(texto_usuario, umbral_confianza=0.1):
    """
    Función de inferencia local para pruebas.
    Sigue exactamente la misma lógica que en `predict.py` (pero retorna tupla).

    Parámetros:
        texto_usuario (str): Texto a analizar.
        umbral_confianza (float): Valor por debajo del cual se devuelve AMBIGUOUS.

    Retorna:
        tuple: (intent, topic, confidence)
    """
    texto_limpio = pipeline["preprocessor"].transform([texto_usuario])
    X_word = pipeline["word_vectorizer"].transform(texto_limpio)
    X_char = pipeline["char_vectorizer"].transform(texto_limpio)
    X_final = hstack([X_word, X_char])

    def get_probs(model, X):
        if hasattr(model, "predict_proba"):
            return model.predict_proba(X)[0]
        else:
            scores = model.decision_function(X)[0]
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


# ============================================================================
# CARGA DEL DATASET DE PRUEBA REAL (HOLDOUT)
# ============================================================================
print(f"Cargando datos de prueba desde: {TEST_DATA_PATH}")
with open(TEST_DATA_PATH, "r", encoding="utf-8") as f:
    test_data = json.load(f)
print(f"Total de ejemplos: {len(test_data)}\n")


# ============================================================================
# EVALUACIÓN SOBRE CADA EJEMPLO
# ============================================================================
y_true_intent = []
y_pred_intent = []
y_true_topic = []
y_pred_topic = []

# Abrir archivo de reporte
with open(REPORT_PATH, "w", encoding="utf-8") as report_file:
    # Escribir cabecera
    report_file.write("=" * 60 + "\n")
    report_file.write("📊 INFORME DE EVALUACIÓN DEL MODELO NLP\n")
    report_file.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    report_file.write("=" * 60 + "\n\n")
    report_file.write("Detalle de predicciones:\n")
    report_file.write("-" * 60 + "\n")

    # También imprimir en consola
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
        # Imprimir en consola
        print(f"{status} \"{texto[:70]}...\"")
        print(f"   Real    -> intent: {true_intent:12} | topic: {true_topic}")
        print(f"   Pred.   -> intent: {pred_intent:12} | topic: {pred_topic} (conf: {conf:.3f})")
        print("-" * 50)

        # Guardar en archivo
        report_file.write(f"{status} Texto: {texto[:100]}\n")
        report_file.write(f"   Real    -> intent: {true_intent:12} | topic: {true_topic}\n")
        report_file.write(f"   Pred.   -> intent: {pred_intent:12} | topic: {pred_topic} (conf: {conf:.3f})\n")
        report_file.write("-" * 50 + "\n")

    # ========================================================================
    # MÉTRICAS GLOBALES
    # ========================================================================
    # Intent
    intent_acc = accuracy_score(y_true_intent, y_pred_intent)
    intent_report = classification_report(y_true_intent, y_pred_intent, zero_division=0)

    # Topic
    topic_acc = accuracy_score(y_true_topic, y_pred_topic)
    topic_report = classification_report(y_true_topic, y_pred_topic, zero_division=0)

    # Mostrar en consola
    print("\n" + "=" * 60)
    print("🎯 MÉTRICAS DE INTENT")
    print("=" * 60)
    print(f"Accuracy: {intent_acc:.4f}")
    print(intent_report)

    print("\n" + "=" * 60)
    print("📚 MÉTRICAS DE TÓPICO")
    print("=" * 60)
    print(f"Accuracy: {topic_acc:.4f}")
    print(topic_report)

    # Guardar en archivo
    report_file.write("\n" + "=" * 60 + "\n")
    report_file.write("🎯 MÉTRICAS DE INTENT\n")
    report_file.write("=" * 60 + "\n")
    report_file.write(f"Accuracy: {intent_acc:.4f}\n")
    report_file.write(intent_report + "\n")

    report_file.write("\n" + "=" * 60 + "\n")
    report_file.write("📚 MÉTRICAS DE TÓPICO\n")
    report_file.write("=" * 60 + "\n")
    report_file.write(f"Accuracy: {topic_acc:.4f}\n")
    report_file.write(topic_report + "\n")

    # Resumen final
    report_file.write("\n" + "=" * 60 + "\n")
    report_file.write(f"Evaluación completada. Total ejemplos: {len(test_data)}\n")
    report_file.write(f"Archivo guardado: {REPORT_PATH}\n")

print(f"\n✅ Reporte guardado en: {REPORT_PATH}")