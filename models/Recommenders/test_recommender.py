import sys, pickle, json
import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict

sys.path.append(str(Path(__file__).resolve().parents[2]))

# ------------------------------------------------------------
# Definición de la clase necesaria para deserializar el modelo
# ------------------------------------------------------------
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

# ------------------------------------------------------------
# 1. CARGA DEL MODELO
# ------------------------------------------------------------
def load_best_model():
    model_path = Path("models/Recommenders/results/best_recom_model.pkl")
    if not model_path.exists():
        raise FileNotFoundError("No se encontró el modelo. Ejecuta primero train_recommenders.py.")
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    print(f"✅ Modelo cargado: {type(model).__name__}")
    return model

# ------------------------------------------------------------
# 2. CARGA DE DATOS DE TEST
# ------------------------------------------------------------
def load_test_data():
    test_df = pd.read_json("data/synthetic_test.json")
    print(f"Test cargado: {test_df.shape[0]} interacciones")
    return test_df

def load_student_profiles():
    profile_path = Path("data/student_profiles_test.json")
    if not profile_path.exists():
        return {}
    with open(profile_path, "r", encoding="utf-8") as f:
        profiles = json.load(f)
    print(f"Perfiles de test cargados: {len(profiles)} estudiantes")
    return profiles

# ------------------------------------------------------------
# 3. EVALUACIÓN (Top-5 Suitability)
# ------------------------------------------------------------
def evaluate_model(model, test_df, student_profiles, n=5):
    # Agrupar combinaciones reales (uid, topic, intent)
    combos = test_df.groupby(["uid", "topic", "intent"]).agg(
        real_suitability=("suitability", "mean"),
        mastery=("mastery_before", "mean"),
        streak=("streak_before", "mean")
    ).reset_index()

    items_catalog = test_df[["item_id", "topic", "difficulty", "item_type"]].drop_duplicates()

    scores = []
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

    return np.mean(scores) if scores else 0.0

# ------------------------------------------------------------
# 4. DEMOSTRACIÓN
# ------------------------------------------------------------
def demo_recommendation(model, uid, topic, intent, student_profiles, items_catalog):
    mastery = 0.5
    streak = 0
    if uid in student_profiles and topic in student_profiles[uid]:
        mastery = student_profiles[uid][topic]["mastery"]
        streak = student_profiles[uid][topic]["streak"]
    recs = model.recommend(uid, topic, intent, mastery, streak, items_catalog, n=5)
    print(f"\nRecomendaciones para {uid} en '{topic}' con intención '{intent}':")
    print(recs)

# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
if __name__ == "__main__":
    model = load_best_model()
    test_df = load_test_data()
    student_profiles = load_student_profiles()
    items_catalog = test_df[["item_id", "topic", "difficulty", "item_type"]].drop_duplicates()

    print("\nEvaluando modelo (Top-5 Suitability)...")
    avg_suit = evaluate_model(model, test_df, student_profiles, n=5)
    print(f"Top-5 Suitability promedio: {avg_suit:.4f}")

    # Demo
    sample_uid = test_df["uid"].iloc[0]
    sample_topic = test_df["topic"].iloc[0]
    sample_intent = test_df["intent"].iloc[0]
    demo_recommendation(model, sample_uid, sample_topic, sample_intent, student_profiles, items_catalog)