import os
import sys
import joblib
from scipy.sparse import hstack

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(TEST_DIR)
MODEL_PATH = os.path.join(BASE_DIR, "models", "NLP", "results", "best_nlp_model.pkl")

def interactuar():
    if not os.path.isfile(MODEL_PATH):
        print("❌ Modelo no encontrado. Entrena primero.")
        return

    print("⏳ Cargando modelo...")
    data = joblib.load(MODEL_PATH)

    model_intent = data["model_intent"]
    model_topic = data["model_topic"]
    word_vectorizer = data["word_vectorizer"]
    char_vectorizer = data["char_vectorizer"]
    preprocessor = data["preprocessor"]

    print("✅ NLP listo (intent + topic)")
    print("(Escribe 'salir' para cerrar)\n")

    while True:
        text = input("🗣️ Usuario: ").strip()
        if text.lower() in ["salir", "exit", "quit"]:
            break

        clean = preprocessor.transform([text])
        word_feat = word_vectorizer.transform(clean)
        char_feat = char_vectorizer.transform(clean)
        final_feat = hstack([word_feat, char_feat])

        intent = model_intent.predict(final_feat)[0]
        topic = model_topic.predict(final_feat)[0]

        print(f"🤖 Intent detectado: {intent}")
        print(f"📚 Tópico detectado: {topic}")
        print("-" * 40)

if __name__ == "__main__":
    interactuar()