import sys
import pickle
from pathlib import Path

# Definición de la clase necesaria para deserializar
class ContextualRecommender:
    def __init__(self, regressor, topic_enc, diff_enc, item_type_enc, intent_enc, feature_columns):
        self.regressor = regressor
        self.topic_enc = topic_enc
        self.diff_enc = diff_enc
        self.item_type_enc = item_type_enc
        self.intent_enc = intent_enc
        self.feature_columns = feature_columns

    def recommend(self, uid, topic, intent, mastery, streak, items_df, n=5):
        # No es necesario implementarla para la extracción
        pass

model_path = Path("models/Recommenders/results/best_recom_model.pkl")
with open(model_path, "rb") as f:
    model = pickle.load(f)

components = {
    "regressor": model.regressor,
    "topic_enc": model.topic_enc,
    "diff_enc": model.diff_enc,
    "item_type_enc": model.item_type_enc,
    "intent_enc": model.intent_enc,
    "feature_columns": model.feature_columns,
}

with open("models/Recommenders/results/recommender_components.pkl", "wb") as f:
    pickle.dump(components, f)

print("✅ Componentes guardados en models/Recommenders/results/recommender_components.pkl")