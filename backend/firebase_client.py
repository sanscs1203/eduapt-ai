# backend/firebase_client.py
# Cliente para interactuar con Firestore (base de datos NoSQL de Firebase).
# Proporciona métodos para leer/escribir usuarios, sesiones, interacciones y feedback.

import firebase_admin
from firebase_admin import credentials, firestore
from config import Config

class FirebaseClient:
    def __init__(self):
        # Inicializar la app de Firebase solo si aún no se ha hecho
        if not firebase_admin._apps:
            cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(cred, {
                'databaseURL': Config.FIREBASE_DATABASE_URL
            })
        self.db = firestore.client()   # Cliente de Firestore

    # --- Usuarios ---
    def get_user(self, uid):
        """Obtiene el documento del usuario por su UID. Retorna dict o None."""
        doc = self.db.collection('users').document(uid).get()
        return doc.to_dict() if doc.exists else None

    def update_user_S(self, uid, S):
        """Actualiza el campo 'S' (vector de estado del estudiante) de un usuario."""
        self.db.collection('users').document(uid).set({'S': S}, merge=True)

    # --- Interacciones (respuestas a preguntas) ---
    def save_interaction(self, data):
        """Guarda una interacción (respuesta) en la colección 'interactions'."""
        self.db.collection('interactions').add(data)

    # --- Sesiones de práctica ---
    def save_session(self, data):
        """Guarda una sesión completa (métrica agregada) en 'sessions'."""
        self.db.collection('sessions').add(data)

    # --- Feedback del estudiante ---
    def save_feedback(self, data):
        """Guarda feedback (útil, fácil, difícil) en 'feedback'."""
        self.db.collection('feedback').add(data)

    # --- Consultas adicionales (opcionales) ---
    def get_user_sessions(self, uid, limit=10):
        """Obtiene las últimas 'limit' sesiones de un usuario, ordenadas por fecha descendente."""
        docs = self.db.collection('sessions').where('uid', '==', uid) \
            .order_by('startedAt', direction=firestore.Query.DESCENDING) \
            .limit(limit).stream()
        return [doc.to_dict() for doc in docs]

    def get_all_interactions(self, uid=None):
        """Recupera todas las interacciones, opcionalmente filtradas por uid."""
        query = self.db.collection('interactions')
        if uid:
            query = query.where('uid', '==', uid)
        return [doc.to_dict() for doc in query.stream()]

    def get_feedback(self, uid=None):
        """Recupera todos los feedbacks, opcionalmente filtrados por uid."""
        query = self.db.collection('feedback')
        if uid:
            query = query.where('uid', '==', uid)
        return [doc.to_dict() for doc in query.stream()]