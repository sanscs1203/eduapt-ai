from abc import ABC, abstractmethod

class BaseRecommender(ABC):
    @abstractmethod
    def fit(self, data):
        pass

    @abstractmethod
    def recommend(self, student_vector, top_n=5):
        pass