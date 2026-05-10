# backend/recommenders/svd_recommender.py
import numpy as np
from sklearn.decomposition import TruncatedSVD
from .base_recommender import BaseRecommender

class SVDRecommender(BaseRecommender):
    def __init__(self, n_factors=50):
        self.n_factors = n_factors
        self.model = TruncatedSVD(n_components=n_factors)
        self.user_map = {}
        self.item_map = {}
        self.reverse_item_map = {}
        self.matrix = None

    def fit(self, interactions):
        # Construir matriz usuario-ítem (ratings)
        users = []
        items = []
        ratings = []
        for inter in interactions:
            uid = inter.get('uid')
            qid = inter.get('question_id')
            if not uid or not qid:
                continue
            if uid not in self.user_map:
                self.user_map[uid] = len(self.user_map)
            if qid not in self.item_map:
                self.item_map[qid] = len(self.item_map)
            users.append(self.user_map[uid])
            items.append(self.item_map[qid])
            ratings.append(1.0 if inter.get('correct', False) else 0.0)

        if not users:
            return

        n_users = len(self.user_map)
        n_items = len(self.item_map)
        self.matrix = np.zeros((n_users, n_items))
        for u, i, r in zip(users, items, ratings):
            self.matrix[u, i] = r

        self.model.fit(self.matrix)
        self.reverse_item_map = {v: k for k, v in self.item_map.items()}

    def recommend(self, user_id, topic, S, n=3):
        if user_id not in self.user_map or self.matrix is None:
            return []
        user_idx = self.user_map[user_id]
        reconstructed = self.model.inverse_transform(self.model.transform(self.matrix))
        user_row = reconstructed[user_idx]
        # Ordenar ítems por rating predicho descendente
        item_indices = np.argsort(user_row)[::-1]
        recommended_ids = []
        for idx in item_indices:
            qid = self.reverse_item_map.get(idx)
            if qid and len(recommended_ids) < n:
                recommended_ids.append(qid)
        return recommended_ids