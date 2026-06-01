# models/Recommenders/test_recommender.py
# Script de evaluación del recomendador entrenado.
# Carga el modelo guardado (best_recom_model.pkl) y evalúa su rendimiento
# usando la métrica "Top-5 Suitability" sobre un conjunto de prueba sintético.
# Los resultados se guardan en evaluation_report.txt dentro de la carpeta results.

import sys
import pickle
import json
import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Asegurar que se pueda importar desde la raíz del proyecto
sys.path.append(str(Path(__file__).resolve().parents[2]))

# ============================================================================
# DEFINICIÓN DE LA CLASE CONTEXTUALRECOMMENDER (necesaria para deserializar)
# ============================================================================
class ContextualRecommender:
    """
    Misma definición que en train_recommenders.py.
    Es necesaria para que pickle pueda reconstruir el objeto correctamente.
    """
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


# ============================================================================
# FUNCIONES DE CARGA
# ============================================================================
def load_best_model():
    """Carga el recomendador guardado (pickle)."""
    model_path = Path("models/Recommenders/results/best_recom_model.pkl")
    if not model_path.exists():
        raise FileNotFoundError("No se encontró el modelo. Ejecuta primero train_recommenders.py.")
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    print(f"✅ Modelo cargado: {type(model).__name__}")
    return model

def load_test_data():
    """Carga el conjunto de prueba sintético (interacciones)."""
    test_df = pd.read_json("data/synthetic_test.json")
    print(f"Test cargado: {test_df.shape[0]} interacciones")
    return test_df

def load_student_profiles():
    """Carga perfiles de estudiantes para prueba (opcional). Si no existe, retorna diccionario vacío."""
    profile_path = Path("data/student_profiles_test.json")
    if not profile_path.exists():
        return {}
    with open(profile_path, "r", encoding="utf-8") as f:
        profiles = json.load(f)
    print(f"Perfiles de test cargados: {len(profiles)} estudiantes")
    return profiles


# ============================================================================
# EVALUACIÓN: TOP-5 SUITABILITY
# ============================================================================
def evaluate_model(model, test_df, student_profiles, n=5):
    """
    Evalúa el modelo calculando la suitability promedio de los ítems recomendados
    (Top-5) para cada combinación única (uid, topic, intent).
    Retorna el promedio y también una lista detallada (por si se quiere guardar).
    """
    # Agrupar combinaciones reales
    combos = test_df.groupby(["uid", "topic", "intent"]).agg(
        real_suitability=("suitability", "mean"),
        mastery=("mastery_before", "mean"),
        streak=("streak_before", "mean")
    ).reset_index()

    items_catalog = test_df[["item_id", "topic", "difficulty", "item_type"]].drop_duplicates()

    scores = []
    details = []  # para guardar detalle por combinación
    for _, row in combos.iterrows():
        uid = row["uid"]
        topic = row["topic"]
        intent = row["intent"]
        mastery = row["mastery"]
        streak = row["streak"]

        if uid in student_profiles and topic in student_profiles[uid]:
            mastery = student_profiles[uid][topic]["mastery"]
            streak = student_profiles[uid][topic]["streak"]

        try:
            recs = model.recommend(uid, topic, intent, mastery, streak, items_catalog, n=n)
        except Exception as e:
            recs = []

        if recs:
            rec_items = test_df[test_df["item_id"].isin(recs) & (test_df["topic"] == topic)]
            avg_rec_suit = rec_items["suitability"].mean() if not rec_items.empty else 0.0
        else:
            avg_rec_suit = 0.0

        scores.append(avg_rec_suit)
        details.append({
            "uid": uid,
            "topic": topic,
            "intent": intent,
            "mastery": mastery,
            "streak": streak,
            "recommended_items": recs,
            "avg_suitability": avg_rec_suit
        })

    return np.mean(scores) if scores else 0.0, details


# ============================================================================
# DEMOSTRACIÓN (opcional, se incluye en el reporte)
# ============================================================================
def demo_recommendation(model, uid, topic, intent, student_profiles, items_catalog):
    """Muestra un ejemplo de recomendaciones para un caso concreto."""
    mastery = 0.5
    streak = 0
    if uid in student_profiles and topic in student_profiles[uid]:
        mastery = student_profiles[uid][topic]["mastery"]
        streak = student_profiles[uid][topic]["streak"]
    recs = model.recommend(uid, topic, intent, mastery, streak, items_catalog, n=5)
    return recs


# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    # Cargar datos y modelo
    model = load_best_model()
    test_df = load_test_data()
    student_profiles = load_student_profiles()
    items_catalog = test_df[["item_id", "topic", "difficulty", "item_type"]].drop_duplicates()

    # Evaluar
    print("\nEvaluando modelo (Top-5 Suitability)...")
    avg_suit, details = evaluate_model(model, test_df, student_profiles, n=5)
    print(f"Top-5 Suitability promedio: {avg_suit:.4f}")

    # Preparar reporte
    results_dir = Path("models/Recommenders/results")
    results_dir.mkdir(parents=True, exist_ok=True)
    report_path = results_dir / "evaluation_report.txt"

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write("📊 INFORME DE EVALUACIÓN DEL RECOMENDADOR\n")
        f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Modelo cargado: {type(model).__name__}\n")
        f.write(f"Total de interacciones en test: {test_df.shape[0]}\n")
        f.write(f"Número de combinaciones (uid, topic, intent): {len(details)}\n\n")
        f.write(f"🎯 Top-5 Suitability promedio: {avg_suit:.4f}\n\n")
        f.write("-" * 60 + "\n")
        f.write("Detalle por combinación:\n")
        f.write("-" * 60 + "\n")
        for d in details:
            f.write(f"Usuario: {d['uid']} | Tema: {d['topic']} | Intención: {d['intent']}\n")
            f.write(f"  Mastery: {d['mastery']:.3f} | Streak: {d['streak']}\n")
            f.write(f"  Recomendados: {d['recommended_items']}\n")
            f.write(f"  Suitability promedio de los recomendados: {d['avg_suitability']:.4f}\n")
            f.write("-" * 40 + "\n")

        # Incluir un ejemplo de demostración con el primer estudiante
        sample_uid = test_df["uid"].iloc[0]
        sample_topic = test_df["topic"].iloc[0]
        sample_intent = test_df["intent"].iloc[0]
        demo_recs = demo_recommendation(model, sample_uid, sample_topic, sample_intent, student_profiles, items_catalog)
        f.write("\n" + "=" * 60 + "\n")
        f.write("🔍 DEMOSTRACIÓN (primer caso del test)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Usuario: {sample_uid}\n")
        f.write(f"Tema: {sample_topic}\n")
        f.write(f"Intención: {sample_intent}\n")
        f.write(f"Recomendaciones (top-5): {demo_recs}\n")

    print(f"\n✅ Reporte guardado en: {report_path}")

    # Opcional: mostrar también la demo en consola
    print("\n--- Demostración ---")
    print(f"Recomendaciones para {sample_uid} en '{sample_topic}' con intención '{sample_intent}':")
    print(demo_recs)