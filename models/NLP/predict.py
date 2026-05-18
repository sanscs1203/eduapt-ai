import joblib
import numpy as np
from scipy.sparse import hstack

# 1. Cargar el modelo final guardado por train_models.py
MODEL_PATH = "results/best_nlp_model.pkl" # Ajusta la ruta según tu estructura
pipeline = joblib.load(MODEL_PATH)

def predecir_intent_y_topic(texto_usuario, umbral_confianza=0.60):
    """
    Aplica control de ambigüedad (C) y clasificación jerárquica (D)
    """
    # Preprocesamiento y extracción de características idéntico al entrenamiento
    texto_limpio = pipeline["preprocessor"].transform([texto_usuario])
    X_word = pipeline["word_vectorizer"].transform(texto_limpio)
    X_char = pipeline["char_vectorizer"].transform(texto_limpio)
    X_final = hstack([X_word, X_char])
    
    # -------------------------------------------------------------
    # PASO 1: Predicción de INTENT con Umbral de Confianza (Sugerencia C)
    # -------------------------------------------------------------
    # Obtener las probabilidades para cada clase de intent
    intent_probs = pipeline["model_intent"].predict_proba(X_final)[0]
    idx_max_intent = np.argmax(intent_probs)
    max_intent_prob = intent_probs[idx_max_intent]
    
    # Si no supera el umbral, controlamos la ambigüedad inmediatamente
    if max_intent_prob < umbral_confianza:
        return {
            "intent": "AMBIGUOUS",
            "topic": "none",
            "confidence": float(max_intent_prob),
            "fallback_message": "No logré comprender del todo tu solicitud. ¿Podrías reformularla?"
        }
    
    intent_detectado = pipeline["intent_classes"][idx_max_intent]
    
    # -------------------------------------------------------------
    # PASO 2: Clasificación Jerárquica / Cascada (Sugerencia D)
    # -------------------------------------------------------------
    # Definimos los intents que NO necesitan contenido académico
    intents_sociales = ["GREETING", "GOODBYE", "CASUAL", "ABOUT", "THANKS"]
    
    if intent_detectado in intents_sociales:
        # Forzamos el tópico a "social" o "none" sin preguntar al modelo de tópicos
        topic_detectado = "social"
    else:
        # Solo si es un intent académico (EXPLAIN, PRACTICE, etc.), llamamos al modelo de tópicos
        topic_probs = pipeline["model_topic"].predict_proba(X_final)[0]
        idx_max_topic = np.argmax(topic_probs)
        topic_detectado = pipeline["topic_classes"][idx_max_topic]
        
    return {
        "intent": intent_detectado,
        "topic": topic_detectado,
        "confidence": float(max_intent_prob),
        "fallback_message": None
    }