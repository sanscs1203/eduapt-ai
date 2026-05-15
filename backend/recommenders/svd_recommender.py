from surprise import SVD, Reader, Dataset, dump
from .base_recommender import BaseRecommender
import pandas as pd

class SVDRecommender(BaseRecommender):
    def __init__(self):
        self.model = None

    # En random_forest_rec.py
    def fit(self, interactions):
        df = pd.DataFrame(interactions)
        if df.empty: return
        
        # Asegurar que el target sea 'util' si existe, si no, 'correct'
        target_col = 'util' if 'util' in df.columns else 'correct'
        
        df['topic_enc'] = self.le_topic.fit_transform(df['topic'])
        df['difficulty_enc'] = df['difficulty'].map(self.difficulty_order).fillna(1).astype(int)
        
        # Usar S_before para predecir, no S_after (el modelo debe predecir con el estado previo)
        S_vals = np.array(df['S_before'].apply(lambda s: [s['a'], s['t'], s['f'], s['d']]).tolist())
        df['S_a'], df['S_t'], df['S_f'], df['S_d'] = S_vals.T
        
        self.clf.fit(df[self.feature_cols], df[target_col]) # <--- Cambio aquí
        self.trained = True

    def recommend(self, user_id, topic_filter, questions_df, top_n=5, exclude_items=None,
                  user_prefs=None, qid_to_format=None):
        if self.model is None:
            return []
        exclude_items = exclude_items or set()

        diff_order = {'Easy': 0.3, 'Medium': 0.6, 'Hard': 0.9}
        qid_to_diff = dict(zip(questions_df['id'], questions_df['difficulty'].map(diff_order).fillna(0.6)))

        topic_qids = questions_df[questions_df['topic'] == topic_filter]['id'].tolist()
        candidates = []
        for qid in topic_qids:
            if qid in exclude_items:
                continue
            est = self.model.predict(str(user_id), str(qid)).est

            pref_bonus = 0.0
            if user_prefs is not None and qid_to_format is not None:
                fmt = qid_to_format.get(qid, '')
                if any(pref in fmt for pref in user_prefs):
                    pref_bonus = 0.1

            final_score = est + pref_bonus
            candidates.append((qid, final_score))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return [qid for qid, _ in candidates[:top_n]]

    def save(self, path):
        dump.dump(path, algo=self.model)

    def load(self, path):
        _, self.model = dump.load(path)