from surprise import SVD, Dataset, Reader
from .base_recommender import BaseRecommender

class SVDRecommender(BaseRecommender):
    def __init__(self, n_factors=100, n_epochs=20):
        self.model = SVD(n_factors=n_factors, n_epochs=n_epochs)
        self.trainset = None

    def fit(self, interactions):
        # Formato: user item rating
        ratings = [(inter['uid'], inter['question_id'], float(inter.get('correct', False)))
                   for inter in interactions if inter.get('uid') and inter.get('question_id')]
        if not ratings:
            return
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(pd.DataFrame(ratings, columns=['user', 'item', 'rating']), reader)
        self.trainset = data.build_full_trainset()
        self.model.fit(self.trainset)

    def recommend(self, user_id, topic, S, n=3):
        # Predecir rating para todos los items del topic y devolver los mejores
        # Placeholder
        return []