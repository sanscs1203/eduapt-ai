import pandas as pd
import json
import os
import joblib
import nltk

from nltk.corpus import stopwords

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import hstack

from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC

from models.NLP.text_processing import TextPreprocessor, custom_tokenizer

# NLTK stopwords
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

# Rutas
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
DATA_PATH = os.path.join(BASE_DIR, "data", "nlp_training_data_pro.json")
RESULTS_DIR = os.path.join(CURRENT_DIR, "results")
MODEL_EXPORT_PATH = os.path.join(RESULTS_DIR, "best_nlp_model.pkl")
REPORT_PATH = os.path.join(RESULTS_DIR, "training_report.txt")
os.makedirs(RESULTS_DIR, exist_ok=True)

# Cargar dataset
print("📥 Cargando dataset NLP...")
with open(DATA_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)
df = pd.DataFrame(data)

X = df['text']
y_intent = df['intent']
y_topic = df['topic']

print(f"✅ Dataset cargado: {len(df)} ejemplos")
print(f"📊 Intents únicos: {y_intent.nunique()}")
print(f"📚 Tópicos únicos: {y_topic.nunique()}")

# Split (estratificado por intent para mantener distribución)
X_train, X_test, y_train_intent, y_test_intent = train_test_split(
    X, y_intent, test_size=0.2, random_state=42, stratify=y_intent
)
# Para tópico usamos los mismos índices (extraemos del split anterior)
y_train_topic = y_topic.loc[X_train.index]
y_test_topic = y_topic.loc[X_test.index]

# Stopwords
try:
    spanish_stopwords = stopwords.words('spanish')
except LookupError:
    spanish_stopwords = []

# Preprocesamiento
preprocessor = TextPreprocessor()
X_train_clean = preprocessor.transform(X_train)
X_test_clean = preprocessor.transform(X_test)

# TF-IDF word + char
word_vectorizer = TfidfVectorizer(
    tokenizer=custom_tokenizer,
    ngram_range=(1, 2),
    max_features=12000,
    sublinear_tf=True,
    stop_words=spanish_stopwords,
    lowercase=False
)
char_vectorizer = TfidfVectorizer(
    analyzer='char_wb',
    ngram_range=(3, 5),
    max_features=20000,
    sublinear_tf=True
)

print("🧠 Generando embeddings TF-IDF...")
X_train_word = word_vectorizer.fit_transform(X_train_clean)
X_test_word = word_vectorizer.transform(X_test_clean)
X_train_char = char_vectorizer.fit_transform(X_train_clean)
X_test_char = char_vectorizer.transform(X_test_clean)

X_train_final = hstack([X_train_word, X_train_char])
X_test_final = hstack([X_test_word, X_test_char])

# Modelos a probar
modelos = [
    ("Naive Bayes", MultinomialNB(), {'alpha': [0.1, 0.5, 1.0]}),
    ("Logistic Regression", LogisticRegression(max_iter=2000, class_weight='balanced'), {'C': [0.5, 1, 3]}),
    ("Linear SVM", LinearSVC(dual=False, class_weight='balanced', max_iter=2000), {'C': [0.5, 1, 3]})
]

# Variables para mejores modelos
best_intent_score = 0
best_intent_model = None
best_intent_name = ""

best_topic_score = 0
best_topic_model = None
best_topic_name = ""

reporte_texto = ""

# ----------------- ENTRENAR INTENT -----------------
print("\n" + "="*60)
print("🎯 ENTRENANDO CLASIFICADOR DE INTENT")
print("="*60)
for nombre, modelo, params in modelos:
    print(f"\n🚀 Entrenando {nombre} (INTENT)")
    grid = GridSearchCV(modelo, params, cv=5, scoring='accuracy', n_jobs=-1, verbose=1)
    grid.fit(X_train_final, y_train_intent)
    best = grid.best_estimator_
    y_pred = best.predict(X_test_final)
    acc = accuracy_score(y_test_intent, y_pred)
    print(f"✅ Accuracy: {acc:.4f}")

    reporte_texto += f"\n{'='*60}\nMODELO: {nombre} (INTENT)\n"
    reporte_texto += f"Best Params: {grid.best_params_}\nAccuracy: {acc:.4f}\n\n"
    reporte_texto += classification_report(y_test_intent, y_pred)
    reporte_texto += f"\n{confusion_matrix(y_test_intent, y_pred)}\n"

    if acc > best_intent_score:
        best_intent_score = acc
        best_intent_model = best
        best_intent_name = nombre

# ----------------- ENTRENAR TOPIC -----------------
print("\n" + "="*60)
print("📚 ENTRENANDO CLASIFICADOR DE TÓPICO")
print("="*60)
for nombre, modelo, params in modelos:
    print(f"\n🚀 Entrenando {nombre} (TOPIC)")
    grid = GridSearchCV(modelo, params, cv=5, scoring='accuracy', n_jobs=-1, verbose=1)
    grid.fit(X_train_final, y_train_topic)
    best = grid.best_estimator_
    y_pred = best.predict(X_test_final)
    acc = accuracy_score(y_test_topic, y_pred)
    print(f"✅ Accuracy: {acc:.4f}")

    reporte_texto += f"\n{'='*60}\nMODELO: {nombre} (TOPIC)\n"
    reporte_texto += f"Best Params: {grid.best_params_}\nAccuracy: {acc:.4f}\n\n"
    reporte_texto += classification_report(y_test_topic, y_pred)
    reporte_texto += f"\n{confusion_matrix(y_test_topic, y_pred)}\n"

    if acc > best_topic_score:
        best_topic_score = acc
        best_topic_model = best
        best_topic_name = nombre

# Guardar todo
modelo_final = {
    "model_intent": best_intent_model,
    "model_topic": best_topic_model,
    "word_vectorizer": word_vectorizer,
    "char_vectorizer": char_vectorizer,
    "preprocessor": preprocessor,
    "intent_classes": sorted(y_intent.unique()),
    "topic_classes": sorted(y_topic.unique())
}
joblib.dump(modelo_final, MODEL_EXPORT_PATH)

with open(REPORT_PATH, "w", encoding="utf-8") as f:
    f.write(reporte_texto)

print("\n====================================")
print("✅ ENTRENAMIENTO COMPLETADO")
print("====================================")
print(f"🏆 Mejor modelo INTENT : {best_intent_name} (accuracy: {best_intent_score:.4f})")
print(f"🏆 Mejor modelo TOPIC  : {best_topic_name} (accuracy: {best_topic_score:.4f})")
print(f"📁 Modelo guardado en: {MODEL_EXPORT_PATH}")