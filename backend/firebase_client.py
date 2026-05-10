# firebase_client.py
import firebase_admin
from firebase_admin import credentials, firestore
from config import Config

class FirebaseClient:
    def __init__(self):
        if not firebase_admin._apps:
            cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(cred, {
                'databaseURL': Config.FIREBASE_DATABASE_URL
            })
        self.db = firestore.client()

    def get_user(self, uid):
        doc = self.db.collection('users').document(uid).get()
        return doc.to_dict() if doc.exists else None

    def update_user_S(self, uid, S):
        self.db.collection('users').document(uid).set({'S': S}, merge=True)

    def save_interaction(self, data):
        self.db.collection('interactions').add(data)

    def save_session(self, data):
        self.db.collection('sessions').add(data)

    def save_feedback(self, data):
        self.db.collection('feedback').add(data)

    def get_user_sessions(self, uid, limit=10):
        docs = self.db.collection('sessions').where('uid', '==', uid) \
            .order_by('startedAt', direction=firestore.Query.DESCENDING) \
            .limit(limit).stream()
        return [doc.to_dict() for doc in docs]

    def get_all_interactions(self, uid=None):
        query = self.db.collection('interactions')
        if uid:
            query = query.where('uid', '==', uid)
        return [doc.to_dict() for doc in query.stream()]

    def get_feedback(self, uid=None):
        query = self.db.collection('feedback')
        if uid:
            query = query.where('uid', '==', uid)
        return [doc.to_dict() for doc in query.stream()]