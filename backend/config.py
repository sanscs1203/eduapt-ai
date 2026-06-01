# backend/config.py
# Configuración central del servidor Flask.
# Carga variables de entorno desde .env y define rutas, puertos y credenciales.

import os
from dotenv import load_dotenv

# Cargar variables del archivo .env (si existe)
load_dotenv()

class Config:
    # --- Configuración del servidor ---
    DEBUG = True                     # Modo depuración (recarga automática)
    HOST = '0.0.0.0'                # Escucha en todas las interfaces
    PORT = 5000                      # Puerto por defecto

    # --- Firebase Admin SDK ---
    # Ruta al archivo JSON de credenciales (cuenta de servicio)
    FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS', 'firebase-service-account.json')
    # URL de la base de datos en tiempo real (Firestore usa otro sistema, pero se deja para compatibilidad)
    FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL', 'https://eduadapt-18f2f.firebaseio.com')

    # --- Rutas de modelos entrenados (carpeta donde se guardan) ---
    # Nota: en app.py se usan rutas específicas dentro de 'models/Recommenders/results/',
    # pero aquí se define un directorio general (quizás no utilizado directamente)
    MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'saved')

    # --- Banco de preguntas ---
    QUESTION_BANK_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'algebra_questions.json')

    # --- Límites de la prueba piloto ---
    PILOT_QUESTION_LIMIT = 5          # Máximo de preguntas en una sesión de prueba