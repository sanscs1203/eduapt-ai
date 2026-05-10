import numpy as np
from sklearn.neighbors import NearestNeighbors
from .base_recommender import BaseRecommender

class KNNRecommender(BaseRecommender):
    def __init__(self, n_neighbors=5):
        self.n_neighbors = n_neighbors
        self.model = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine')
        self.users = []
        self.user_vectors = []
        self.user_resources = {}

    def fit(self, interactions):
        # Agrupar interacciones por usuario, crear vector S promedio y recursos vistos
        user_data = {}
        for inter in interactions:
            uid = inter.get('uid')
            if not uid: continue
            if uid not in user_data:
                user_data[uid] = {'S_sum': np.zeros(4), 'count': 0, 'resources': set()}
            S = inter.get('S_after', {})
            vec = np.array([S.get('a',0), S.get('t',0), S.get('f',0), S.get('d',0)])
            user_data[uid]['S_sum'] += vec
            user_data[uid]['count'] += 1
            user_data[uid]['resources'].add(inter.get('question_id'))

        self.users = list(user_data.keys())
        self.user_vectors = [data['S_sum'] / data['count'] for data in user_data.values()]
        self.user_resources = {uid: data['resources'] for uid, data in user_data.items()}

        if self.user_vectors:
            self.model.fit(np.array(self.user_vectors))

    def recommend(self, user_id, topic, S, n=3):
        S_vec = np.array([S['a'], S['t'], S['f'], S['d']]).reshape(1, -1)
        if not self.user_vectors:
            return []
        distances, indices = self.model.kneighbors(S_vec)

        # Recursos de los vecinos
        candidates = set()
        for idx in indices[0]:
            neighbor_id = self.users[idx]
            candidates.update(self.user_resources.get(neighbor_id, set()))

        # Buscar en banco de preguntas (o recursos) esos IDs
        # Placeholder: devolver recursos del topic
        return list(candidates)[:n]