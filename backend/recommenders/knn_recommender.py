import numpy as np
import pickle
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler
from .base_recommender import BaseRecommender

class KNNByS(BaseRecommender):
    def __init__(self, k=5):
        self.k = k
        self.user_vectors = {}
        self.user_ids = []
        self.knn = None
        self.scaler = None
        self.user_questions = {}

    def fit(self, user_vectors_dict, user_questions_history, scaler=None):
        self.user_vectors = user_vectors_dict
        self.user_ids = list(user_vectors_dict.keys())
        self.user_questions = user_questions_history
        self.scaler = scaler

        if not self.user_ids:
            return

        X = np.array([user_vectors_dict[uid] for uid in self.user_ids])
        self.knn = NearestNeighbors(
            n_neighbors=min(self.k, len(self.user_ids)), metric='euclidean'
        )
        self.knn.fit(X)

    def recommend(self, user_vector, topic, questions_df, top_n=5, filter_seen=True,
              user_history=None, user_prefs=None, qid_to_format=None):
        """
        user_prefs: lista de formatos preferidos (ej. ['video', 'text'])
        qid_to_format: dict {question_id: format}
        """
        if self.knn is None:
            return []

        if isinstance(user_vector, dict):
            vec = [user_vector.get('a', 0.5), user_vector.get('t', 0.5),
                user_vector.get('f', 0.5), user_vector.get('d', 0.5)]
        else:
            vec = list(user_vector)

        if self.scaler is not None:
            vec = self.scaler.transform([vec])[0]

        dist, idxs = self.knn.kneighbors([vec])
        neighbor_uids = [self.user_ids[i] for i in idxs[0]]

        candidate_scores = {}
        for nuid in neighbor_uids:
            for qid, score in self.user_questions.get(nuid, {}).items():
                if filter_seen and user_history and qid in user_history:
                    continue
                candidate_scores[qid] = candidate_scores.get(qid, 0) + score

        topic_qids = set(questions_df[questions_df['topic'] == topic]['id'].tolist())
        
        # ---- Ajuste por dificultad y preferencias ----
        # Mapa de dificultad numérica
        diff_order = {'Easy': 0.3, 'Medium': 0.6, 'Hard': 0.9}
        qid_to_diff = dict(zip(questions_df['id'], questions_df['difficulty'].map(diff_order).fillna(0.6)))
        user_a = vec[0]  # habilidad actual
        user_d = vec[3] if len(vec) > 3 else 0.5  # dominio

        scored_items = []
        for qid, raw_score in candidate_scores.items():
            if qid not in topic_qids:
                continue
            
            # Factor de dificultad: queremos preguntas cerca de la habilidad, pero ligeramente superiores
            diff = qid_to_diff.get(qid, 0.6)
            # Penalización si la dificultad está muy lejos de 'a'
            diff_gap = abs(diff - user_a)
            difficulty_score = 1.0 - diff_gap  # máximo 1 cuando diff == user_a

            # Bonus de preferencia
            pref_bonus = 0.0
            if user_prefs is not None and qid_to_format is not None:
                fmt = qid_to_format.get(qid, '')
                if any(pref in fmt for pref in user_prefs):
                    pref_bonus = 0.15  # pequeño bonus

            final_score = raw_score * (0.8 + 0.2 * difficulty_score) + pref_bonus
            scored_items.append((qid, final_score))
        
        if not scored_items:
            return questions_df[questions_df['topic'] == topic]['id'].head(top_n).tolist()

        scored_items.sort(key=lambda x: x[1], reverse=True)
        return [qid for qid, _ in scored_items[:top_n]]

    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    def load(self, path):
        with open(path, 'rb') as f:
            loaded = pickle.load(f)
        self.__dict__.update(loaded.__dict__)