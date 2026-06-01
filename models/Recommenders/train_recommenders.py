# models/Recommenders/train_recommenders.py
# Script de entrenamiento del sistema de recomendación contextual.
# Entrena tres modelos (Random Forest, Gradient Boosting, MLP) con búsqueda de hiperparámetros,
# evalúa con validación cruzada (MSE) y guarda el mejor modelo en el formato esperado por app.py:
#   - recommender_components.pkl (diccionario con regresor, codificadores y columnas)
#   - training_report.txt (reporte de resultados)

import os
import sys
import json
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import RandomizedSearchCV, KFold
from sklearn.metrics import mean_squared_error
import time
import datetime

# Agregar la raíz del proyecto al path (por si se necesitan otros módulos)
sys.path.append(str(Path(__file__).resolve().parents[2]))


# ============================================================================
# CLASE CONTEXTUAL RECOMMENDER (wrapper para predicción)
# Esta clase se incluye por si se quisiera guardar el objeto completo,
# pero no es necesaria para el formato recommender_components.
# ============================================================================
class ContextualRecommender:
    """
    Recomendador que utiliza un regresor (entrenado) para predecir la puntuación
    de cada ítem (pregunta o recurso) dadas las características del estudiante
    y del contexto. Luego selecciona los n ítems con mayor puntuación.
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
# CARGA Y PREPROCESAMIENTO DE DATOS
# ============================================================================
def load_data():
    """Carga los conjuntos de entrenamiento y prueba desde archivos JSON."""
    # Construir rutas absolutas desde la raíz del proyecto
    base_dir = Path(__file__).resolve().parents[2]  # raíz del proyecto (eduapt-ai)
    train_path = base_dir / "data" / "synthetic_train.json"
    test_path = base_dir / "data" / "synthetic_test.json"
    train = pd.read_json(train_path)
    test = pd.read_json(test_path)
    print(f"Datos cargados: Train {train.shape[0]} filas, Test {test.shape[0]} filas")
    return train, test


def preprocess(df, topic_enc=None, diff_enc=None, item_type_enc=None, intent_enc=None):
    """
    Codifica las variables categóricas usando LabelEncoder.
    Si no se proporcionan codificadores, se crean nuevos y se ajustan.
    Retorna el DataFrame transformado y los codificadores.
    """
    if topic_enc is None:
        topic_enc = LabelEncoder()
        topic_enc.fit(df["topic"])
    if diff_enc is None:
        diff_enc = LabelEncoder()
        diff_enc.fit(df["difficulty"])
    if item_type_enc is None:
        item_type_enc = LabelEncoder()
        item_type_enc.fit(df["item_type"])
    if intent_enc is None:
        intent_enc = LabelEncoder()
        intent_enc.fit(df["intent"])

    df = df.copy()
    df["topic_enc"] = topic_enc.transform(df["topic"])
    df["difficulty_enc"] = diff_enc.transform(df["difficulty"])
    df["item_type_enc"] = item_type_enc.transform(df["item_type"])
    df["intent_enc"] = intent_enc.transform(df["intent"])
    return df, topic_enc, diff_enc, item_type_enc, intent_enc


# ============================================================================
# FUNCIONES DE ENTRENAMIENTO CON BÚSQUEDA DE HIPERPARÁMETROS
# ============================================================================
def train_random_forest(X, y):
    """Entrena un Random Forest Regressor con RandomizedSearchCV."""
    rf = RandomForestRegressor(random_state=42, n_jobs=-1)
    param_dist = {
        'n_estimators': [100, 200, 300],
        'max_depth': [5, 10, 15, None],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2],
        'max_features': ['sqrt', 'log2']
    }
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    search = RandomizedSearchCV(rf, param_distributions=param_dist, n_iter=50,
                                cv=cv, scoring='neg_mean_squared_error',
                                random_state=42, n_jobs=-1, verbose=1)
    search.fit(X, y)
    best_mse = -search.best_score_
    return search.best_estimator_, best_mse


def train_gradient_boosting(X, y):
    """Entrena un Gradient Boosting Regressor con RandomizedSearchCV."""
    gb = GradientBoostingRegressor(random_state=42)
    param_dist = {
        'n_estimators': [100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.05, 0.1, 0.2],
        'subsample': [0.8, 1.0],
        'min_samples_leaf': [1, 2]
    }
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    search = RandomizedSearchCV(gb, param_distributions=param_dist, n_iter=40,
                                cv=cv, scoring='neg_mean_squared_error',
                                random_state=42, n_jobs=-1, verbose=1)
    search.fit(X, y)
    best_mse = -search.best_score_
    return search.best_estimator_, best_mse


def train_mlp(X, y):
    """Entrena una red neuronal (MLPRegressor) con RandomizedSearchCV."""
    mlp = MLPRegressor(random_state=42, max_iter=500, early_stopping=True)
    param_dist = {
        'hidden_layer_sizes': [(50,), (100,), (50, 25)],
        'activation': ['relu', 'tanh'],
        'alpha': [0.0001, 0.001, 0.01],
        'learning_rate_init': [0.001, 0.01],
    }
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    search = RandomizedSearchCV(mlp, param_distributions=param_dist, n_iter=20,
                                cv=cv, scoring='neg_mean_squared_error',
                                random_state=42, n_jobs=-1, verbose=1)
    search.fit(X, y)
    best_mse = -search.best_score_
    return search.best_estimator_, best_mse


# ============================================================================
# MAIN
# ============================================================================
def main():
    start_time = time.time()

    # 1. Crear directorio de resultados si no existe
    results_dir = Path("models/Recommenders/results")
    results_dir.mkdir(parents=True, exist_ok=True)

    # 2. Cargar datos
    train_df, test_df = load_data()

    # 3. Preprocesar (codificar variables categóricas)
    train_proc, topic_enc, diff_enc, item_type_enc, intent_enc = preprocess(train_df)
    # No necesitamos test aquí, pero lo procesamos por si acaso
    test_proc, _, _, _, _ = preprocess(test_df, topic_enc, diff_enc, item_type_enc, intent_enc)

    # 4. Definir características y objetivo
    features = ["topic_enc", "difficulty_enc", "mastery_before", "streak_before",
                "item_type_enc", "intent_enc"]
    target = "suitability"
    X_train = train_proc[features]
    y_train = train_proc[target]

    models_results = {}

    # 5. Entrenar cada modelo
    print("\n--- RandomForest ---")
    rf_model, rf_mse = train_random_forest(X_train, y_train)
    models_results['RandomForest'] = (rf_model, rf_mse)
    print(f"MSE validación: {rf_mse:.4f}")

    print("\n--- GradientBoosting ---")
    gb_model, gb_mse = train_gradient_boosting(X_train, y_train)
    models_results['GradientBoosting'] = (gb_model, gb_mse)
    print(f"MSE validación: {gb_mse:.4f}")

    print("\n--- MLP (Red Neuronal) ---")
    mlp_model, mlp_mse = train_mlp(X_train, y_train)
    models_results['MLP'] = (mlp_model, mlp_mse)
    print(f"MSE validación: {mlp_mse:.4f}")

    # 6. Seleccionar el mejor modelo (menor MSE)
    best_name = min(models_results, key=lambda k: models_results[k][1])
    best_regressor = models_results[best_name][0]
    print(f"\n🏆 Mejor modelo: {best_name} con MSE={models_results[best_name][1]:.4f}")

    # 7. Construir el diccionario de componentes en el formato que espera app.py
    recommender_components = {
        'regressor': best_regressor,
        'topic_enc': topic_enc,
        'diff_enc': diff_enc,
        'item_type_enc': item_type_enc,
        'intent_enc': intent_enc,
        'feature_columns': features
    }

    # 8. Guardar el diccionario como recommender_components.pkl
    components_path = results_dir / "recommender_components.pkl"
    with open(components_path, "wb") as f:
        pickle.dump(recommender_components, f)
    print(f"✅ Componentes guardados en: {components_path}")

    # 9. Opcional: guardar también el objeto ContextualRecommender completo para otros usos
    recommender_obj = ContextualRecommender(best_regressor, topic_enc, diff_enc,
                                            item_type_enc, intent_enc, features)
    obj_path = results_dir / "best_recom_model.pkl"
    with open(obj_path, "wb") as f:
        pickle.dump(recommender_obj, f)
    print(f"✅ Objeto recomendador guardado en: {obj_path}")

    # 10. Generar reporte de entrenamiento
    elapsed = (time.time() - start_time) / 60
    report = f"""
Training Report - 3 Models Evaluation
Date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Dataset: {train_df.shape[0]} train / {test_df.shape[0]} test samples
Total time: {elapsed:.1f} min

Models performance (cross-validation MSE):
    RandomForest        MSE: {models_results['RandomForest'][1]:.4f}
    GradientBoosting    MSE: {models_results['GradientBoosting'][1]:.4f}
    MLP                 MSE: {models_results['MLP'][1]:.4f}

Selected model: {best_name} (lowest MSE)
Saved components: recommender_components.pkl (dict with regressor, encoders, feature_columns)
Also saved: best_recom_model.pkl (full ContextualRecommender object)
"""
    report_path = results_dir / "training_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report.strip())
    print(report)


if __name__ == "__main__":
    main()