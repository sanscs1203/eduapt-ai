# train_recommenders.py
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from firebase_client import FirebaseClient
from recommenders.knn_recommender import KNNRecommender
from recommenders.svd_recommender import SVDRecommender
from recommenders.random_forest_rec import RandomForestRecommender
import pickle

def load_data():
    """Carga todas las interacciones desde Firestore"""
    fb = FirebaseClient()
    interactions = fb.get_all_interactions()
    print(f"Loaded {len(interactions)} interactions")
    return interactions

def train_and_save():
    interactions = load_data()
    if not interactions:
        print("No interactions found, creating dummy models")
        return

    # KNN
    knn = KNNRecommender(n_neighbors=5)
    knn.fit(interactions)
    with open('saved/knn_model.pkl', 'wb') as f:
        pickle.dump(knn, f)
    print("KNN model saved")

    # SVD
    svd = SVDRecommender()
    svd.fit(interactions)
    with open('saved/svd_model.pkl', 'wb') as f:
        pickle.dump(svd, f)
    print("SVD model saved")

    # Random Forest
    rf = RandomForestRecommender()
    rf.fit(interactions)
    with open('saved/rf_model.pkl', 'wb') as f:
        pickle.dump(rf, f)
    print("Random Forest model saved")

if __name__ == '__main__':
    os.makedirs('saved', exist_ok=True)
    train_and_save()