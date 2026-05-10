# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000

    # Firebase Admin SDK
    FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS', 'firebase-service-account.json')
    FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL', 'https://eduadapt-18f2f.firebaseio.com')

    # Rutas de modelos
    MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'saved')

    # Banco de preguntas
    QUESTION_BANK_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'algebra_questions.json')

    # Límites
    PILOT_QUESTION_LIMIT = 5