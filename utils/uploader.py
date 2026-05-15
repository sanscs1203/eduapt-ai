import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Obtener la ruta raíz del proyecto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Rutas absolutas
FIREBASE_KEY_PATH = os.path.join(BASE_DIR, "firebase-service-account.json")

QUESTIONS_PATH = os.path.join(BASE_DIR, "data", "algebra_questions.json")
RESOURCES_PATH = os.path.join(BASE_DIR, "data", "resources.json")

# 1. Configuración de Firebase
try:
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    firebase_admin.initialize_app(cred)

    db = firestore.client()

    print("✅ Conexión exitosa con Firebase.")

except Exception as e:
    print(f"❌ Error al conectar con Firebase: {e}")
    exit()


def upload_to_firestore(file_path, collection_name):
    """Lee un JSON y sube cada entrada como documento independiente."""

    if not os.path.exists(file_path):
        print(f"⚠️ El archivo {file_path} no existe. Saltando...")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"--- Iniciando subida a la colección: '{collection_name}' ---")

    batch = db.batch()
    count = 0

    for doc_id, content in data.items():

        doc_ref = db.collection(collection_name).document(doc_id)

        batch.set(doc_ref, content)

        count += 1

        # Firestore permite máximo 500 operaciones por batch
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()

            print(f"Procesados {count} documentos...")

    batch.commit()

    print(f"✅ Éxito: Se subieron {count} documentos a '{collection_name}'.")


# 2. Ejecutar carga
if __name__ == "__main__":

    upload_to_firestore(QUESTIONS_PATH, 'questions')

    upload_to_firestore(RESOURCES_PATH, 'resources')

    print("\n🚀 ¡Toda la información ha sido sincronizada con EduAdapt!")