import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from .base_recommender import BaseRecommender

class RandomForestRecommender(BaseRecommender):
    def __init__(self):
        self.clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        self.le_topic = LabelEncoder()
        self.difficulty_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
        self.trained = False
        self.scaler_S = None
        self.feature_cols = ['topic_enc', 'difficulty_enc', 'S_a', 'S_t', 'S_f', 'S_d']

    def fit(self, interactions):
        df = pd.DataFrame(interactions)
        if df.empty: return
        
        df['topic_enc'] = self.le_topic.fit_transform(df['topic'])
        df['difficulty_enc'] = df['difficulty'].map(self.difficulty_order).fillna(1).astype(int)
        
        S_vals = np.array(df['S_after'].apply(lambda s: [s['a'], s['t'], s['f'], s['d']]).tolist())
        df['S_a'], df['S_t'], df['S_f'], df['S_d'] = S_vals.T
        
        self.clf.fit(df[self.feature_cols], df['correct'])
        self.trained = True

    def predict_proba(self, user_S, topic, difficulty):
        if not self.trained: return 0.5
        
        if self.scaler_S is not None:
            s_vec = np.array([[user_S['a'], user_S['t'], user_S['f'], user_S['d']]])
            s_scaled = self.scaler_S.transform(s_vec)[0]
        else:
            s_scaled = [user_S['a'], user_S['t'], user_S['f'], user_S['d']]
        
        input_df = pd.DataFrame([{
            'topic_enc': self.le_topic.transform([topic])[0],
            'difficulty_enc': self.difficulty_order.get(difficulty, 1),
            'S_a': s_scaled[0], 'S_t': s_scaled[1], 
            'S_f': s_scaled[2], 'S_d': s_scaled[3]
        }])
        return self.clf.predict_proba(input_df[self.feature_cols])[0, 1]

    def recommend(self, user_S, topic_filter, questions_df, top_n=5, exclude_items=None):
        if not self.trained: return []
        exclude_items = exclude_items or set()
        
        candidates = questions_df[questions_df['topic'] == topic_filter]
        scored = []
        for _, row in candidates.iterrows():
            if row['id'] in exclude_items: continue
            
            prob = self.predict_proba(user_S, row['topic'], row.get('difficulty', 'Medium'))
            # Probabilidad de utilidad: mayor es mejor
            scored.append((row['id'], prob))
            
        scored.sort(key=lambda x: x[1], reverse=True)
        return [qid for qid, _ in scored[:top_n]]

    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    @staticmethod
    def load(path):
        with open(path, 'rb') as f:
            return pickle.load(f)