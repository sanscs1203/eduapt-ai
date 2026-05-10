from sklearn.ensemble import RandomForestClassifier
import numpy as np
from .base_recommender import BaseRecommender

class RandomForestRecommender(BaseRecommender):
    def __init__(self, n_estimators=100):
        self.model = RandomForestClassifier(n_estimators=n_estimators)
        self.trained = False

    def fit(self, interactions):
        X, y = [], []
        for inter in interactions:
            S = inter.get('S_after', {})
            features = [S.get('a',0), S.get('t',0), S.get('f',0), S.get('d',0)]
            X.append(features)
            y.append(int(inter.get('correct', False)))
        if X:
            self.model.fit(np.array(X), y)
            self.trained = True

    def recommend(self, user_id, topic, S, n=3):
        # Predecir probabilidad de éxito para cada recurso y devolver los mejores
        return []