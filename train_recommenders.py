"""
Entrenamiento avanzado de recomendadores – EduAdapt AI
- Simulación secuencial con StudentModel (S dinámico).
- 300 usuarios sintéticos, 60 interacciones cada uno.
- Recencia temporal (peso por orden de intentos) en KNN y RF.
- Escala de confianza para SVD (acierto→5, fallo→1) + SVDpp.
- Features extra para Random Forest (rolling accuracy, intentos, preferencias, interacción topic*difficulty).
- Target RF: utilidad pedagógica (delta_a > umbral)
- Dificultad empírica (1 - tasa de acierto).
- Normalización de S en RF.
- GridSearch para KNN (k), SVD (n_factors, n_epochs) y RF (n_estimators, max_depth).
- Semilla fija (42). Guarda datasets y modelos.
"""
import sys, os, json, pickle, random, ast
from collections import deque
import numpy as np
import pandas as pd
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from surprise import SVD, SVDpp, Reader, Dataset as SurpriseDataset
from surprise.model_selection import GridSearchCV as SurpriseGridSearchCV

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from agents.student_model import StudentModel
from recommenders.knn_recommender import KNNByS
from recommenders.svd_recommender import SVDRecommender
from recommenders.random_forest_rec import RandomForestRecommender

SEED = 42
np.random.seed(SEED)
random.seed(SEED)

MODEL_DIR = os.path.join('models', 'saved')
DATA_DIR = os.path.join('data')
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

QUESTIONS_PATH = os.path.join(DATA_DIR, 'algebra_questions_expanded.json')
RESOURCES_PATH = os.path.join(DATA_DIR, 'resources.json')

# ------------------------------------------------------------
# Carga de datos estáticos
# ------------------------------------------------------------
def load_questions():
    with open(QUESTIONS_PATH, 'r', encoding='utf-8') as f:
        qdict = json.load(f)
    questions = []
    for topic, qs in qdict.items():
        for q in qs:
            q['topic'] = topic
            questions.append(q)
    return pd.DataFrame(questions)

def load_resource_formats():
    if not os.path.exists(RESOURCES_PATH):
        return {}
    with open(RESOURCES_PATH, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    return {rec_id: rec.get('format', 'text') for rec_id, rec in raw.items()}

# ------------------------------------------------------------
# Dificultad empírica
# ------------------------------------------------------------
def add_empirical_difficulty(df):
    correct_rate = df.groupby('question_id')['correct'].mean()
    df['emp_diff'] = df['question_id'].map(1 - correct_rate)
    return df

# ------------------------------------------------------------
# Usuarios sintéticos
# ------------------------------------------------------------
def generate_synthetic_users(n=300):
    users = []
    levels = ['low', 'mid', 'high']
    all_prefs = ['formulas', 'text', 'video', 'exercises', 'examples']
    for i in range(n):
        level = random.choice(levels)
        if level == 'low':
            a = random.uniform(0.2, 0.5); d = random.uniform(0.1, 0.4)
        elif level == 'mid':
            a = random.uniform(0.4, 0.7); d = random.uniform(0.4, 0.7)
        else:
            a = random.uniform(0.6, 0.95); d = random.uniform(0.6, 0.95)
        t = random.uniform(0.2, 0.9)
        f = random.uniform(0.1, 1.0)
        prefs = random.sample(all_prefs, k=random.randint(1, 3))
        users.append({
            'user_id': f'syn_{i:03d}',
            'S': [a, t, f, d],
            'preferences': prefs,
            'self_level': level
        })
    return users

# ------------------------------------------------------------
# Simulación avanzada (con ruido, fatiga, preferencias)
# ------------------------------------------------------------
def simulate_interactions_advanced(users, questions_df, resource_fmt_map, n_inter=60):
    sm = StudentModel()
    diff_map = {'Easy': 0.3, 'Medium': 0.6, 'Hard': 0.9}
    interactions = []

    for user in users:
        uid = user['user_id']
        prefs = set(user['preferences'])
        S = {'a': user['S'][0], 't': user['S'][1], 'f': user['S'][2], 'd': user['S'][3]}
        self_level = user['self_level']
        n_questions = len(questions_df)

        chosen = questions_df.sample(n=n_inter, replace=(n_questions < n_inter), random_state=SEED)
        last_5 = deque(maxlen=5)

        for idx, (_, row) in enumerate(chosen.iterrows()):
            difficulty = row.get('difficulty', 'Medium')
            diff_factor = diff_map.get(difficulty, 0.6)

            base_prob = 1 / (1 + np.exp(-6 * (S['a'] - diff_factor)))
            fmt = resource_fmt_map.get(row.get('resource_id', ''), 'text')
            pref_bonus = 0.1 if (prefs and any(p in fmt for p in prefs)) else 0.0
            fatigue = 0.05 * (idx / n_inter)
            noise = np.random.normal(0, 0.05)

            prob_correct = np.clip(base_prob + pref_bonus - fatigue + noise, 0.1, 0.95)
            correct = 1 if random.random() < prob_correct else 0

            base_time = 30 + 10 * diff_factor * 10
            skill_factor = 1.5 - S['a']
            response_time = int(np.clip(base_time * skill_factor * random.uniform(0.8, 1.2), 10, 180))

            rolling_acc = np.mean(last_5) if len(last_5) > 0 else 0.5
            attempts = idx
            pref_match = 1 if any(p in fmt for p in prefs) else 0

            interactions.append({
                'uid': uid,
                'question_id': row['id'],
                'correct': correct,
                'topic': row['topic'],
                'difficulty': difficulty,
                'S_before': S.copy(),
                'response_time_sec': response_time,
                'rolling_accuracy': rolling_acc,
                'attempts': attempts,
                'preference_match': pref_match,
                'resource_format': fmt,
                'preferences': list(prefs)     # guardamos preferencias para evaluación
            })

            S = sm.update(S, bool(correct), response_time_sec=response_time, self_level=self_level)
            last_5.append(correct)
            interactions[-1]['S_after'] = S.copy()

    inter_df = pd.DataFrame(interactions)
    inter_df = add_empirical_difficulty(inter_df)
    return inter_df

# ------------------------------------------------------------
# Peso de recencia
# ------------------------------------------------------------
def add_recency_weights(df, decay=0.1):
    df = df.copy()
    max_attempts_per_user = df.groupby('uid')['attempts'].transform('max')
    df['time_weight'] = np.exp(-decay * (max_attempts_per_user - df['attempts']))
    return df

# ------------------------------------------------------------
# KNN: vector ponderado
# ------------------------------------------------------------
def compute_weighted_S(user_data):
    w = user_data['time_weight'].values
    correct = user_data['correct'].values
    a = np.average(correct, weights=w) if w.sum() > 0 else 0.5
    t = np.average(np.ones_like(correct), weights=w) if w.sum() > 0 else 0.5
    f = np.average(1 - correct, weights=w) if w.sum() > 0 else 0.5
    d = 1 - w.max() if len(w) > 0 else 0.5
    return np.array([a, t, f, d])

# ------------------------------------------------------------
# Entrenamiento KNN
# ------------------------------------------------------------
def train_best_knn(train_interactions, val_users, val_interactions, questions_df):
    print("\n🔍 GridSearch KNN (con recencia y normalización)...")
    user_vectors_raw = {}
    user_questions = {}
    for uid, grp in train_interactions.groupby('uid'):
        vec = compute_weighted_S(grp)
        user_vectors_raw[uid] = vec
        user_questions[uid] = dict(zip(grp['question_id'], grp['correct']))
    scaler = MinMaxScaler()
    all_vecs = np.array(list(user_vectors_raw.values()))
    scaler.fit(all_vecs)
    user_vectors_scaled = {uid: scaler.transform([vec])[0] for uid, vec in user_vectors_raw.items()}
    best_k = 5
    best_prec = 0
    val_user_ids = {u['user_id'] for u in val_users}
    for k in [3, 5, 7, 9, 11, 13, 15]:
        knn = KNNByS(k=k)
        knn.fit(user_vectors_scaled, user_questions_history=user_questions, scaler=scaler)
        precs = []
        for uid, grp in val_interactions.groupby('uid'):
            if uid not in val_user_ids:
                continue
            last_row = grp.sort_values('attempts').iloc[-1]
            S_last = last_row['S_after']
            if isinstance(S_last, str):
                S_last = eval(S_last)
            topic = grp['topic'].mode().iloc[0]
            # Definir relevant como utilidad (delta_a > 0.02) para validación
            grp['delta_a'] = grp.apply(lambda row: row['S_after']['a'] - row['S_before']['a'], axis=1)
            relevant = set(grp[grp['delta_a'] > 0.02]['question_id'].tolist())
            if not relevant:
                continue
            recs = knn.recommend(S_last, topic, questions_df, top_n=5, filter_seen=False)
            if recs:
                hit = len(set(recs) & relevant)
                precs.append(hit / min(5, len(recs)))
        avg_prec = np.mean(precs) if precs else 0
        print(f"  k={k}: Precision@5={avg_prec:.4f}")
        if avg_prec > best_prec:
            best_prec = avg_prec
            best_k = k
    print(f"✅ Mejor k={best_k} con Precision@5={best_prec:.4f}")
    final_knn = KNNByS(k=best_k)
    final_knn.fit(user_vectors_scaled, user_questions_history=user_questions, scaler=scaler)
    return final_knn, best_k, best_prec

# ------------------------------------------------------------
# Entrenamiento SVD
# ------------------------------------------------------------
def train_best_svd(train_interactions):
    print("\n🔍 GridSearch SVD/SVDpp (escala confianza 1-5)...")
    df = train_interactions[['uid', 'question_id', 'correct']].copy()
    df['rating'] = df['correct'].apply(lambda c: 5 if c == 1 else 1)
    reader = Reader(rating_scale=(1, 5))
    data = SurpriseDataset.load_from_df(df[['uid', 'question_id', 'rating']], reader)

    param_grid = {
        'n_factors': [1, 2, 3, 5, 8, 10, 15],
        'n_epochs': [20, 30, 40, 50, 60],
        'lr_all': [0.005, 0.01],
        'reg_all': [0.02, 0.1]
    }

    gs_svd = SurpriseGridSearchCV(SVD, param_grid, measures=['RMSE'], cv=3, n_jobs=-1)
    gs_svd.fit(data)

    gs_pp = SurpriseGridSearchCV(SVDpp, param_grid, measures=['RMSE'], cv=3, n_jobs=-1)
    gs_pp.fit(data)

    if gs_svd.best_score['rmse'] <= gs_pp.best_score['rmse']:
        best = gs_svd
        algo_class = SVD
        print("✅ SVD normal gana")
    else:
        best = gs_pp
        algo_class = SVDpp
        print("✅ SVDpp gana")

    best_params = best.best_params['rmse']
    best_rmse = best.best_score['rmse']

    full_trainset = data.build_full_trainset()
    final_model = algo_class(**best_params)
    final_model.fit(full_trainset)

    svd_rec = SVDRecommender()
    svd_rec.model = final_model
    return svd_rec, best_params, best_rmse

# ------------------------------------------------------------
# Entrenamiento Random Forest (target: utilidad pedagógica)
# ------------------------------------------------------------
def train_best_rf(train_interactions):
    print("\n🔍 GridSearch Random Forest (target: utilidad delta_a > 0.02)...")
    df = train_interactions.copy()

    # Calcular ganancia de aprendizaje
    df['delta_a'] = df.apply(lambda row: row['S_after']['a'] - row['S_before']['a'], axis=1)
    df['util'] = (df['delta_a'] > 0.02).astype(int)

    # Codificar topic y dificultad
    le_topic = LabelEncoder()
    df['topic_enc'] = le_topic.fit_transform(df['topic'])
    diff_map = {'Easy': 0, 'Medium': 1, 'Hard': 2}
    df['difficulty_enc'] = df['difficulty'].map(diff_map).fillna(1)

    df['topic_diff_interact'] = df['topic_enc'] * df['difficulty_enc']

    # Extraer S_before (estado previo)
    S_before_cols = np.array(df['S_before'].apply(
        lambda s: [s['a'], s['t'], s['f'], s['d']]
    ).tolist())

    scaler_S = MinMaxScaler()
    S_scaled = scaler_S.fit_transform(S_before_cols)
    df['S_a'] = S_scaled[:, 0]
    df['S_t'] = S_scaled[:, 1]
    df['S_f'] = S_scaled[:, 2]
    df['S_d'] = S_scaled[:, 3]

    if 'time_weight' not in df.columns:
        df = add_recency_weights(df, decay=0.1)

    features = df[['topic_enc', 'difficulty_enc', 'topic_diff_interact',
                   'S_a', 'S_t', 'S_f', 'S_d',
                   'rolling_accuracy', 'attempts', 'preference_match']]
    target = df['util'].astype(int)
    sample_weights = df['time_weight'].values

    param_grid = {
        'n_estimators': [50, 100],
        'max_depth': [5, 8, 12],
        'min_samples_split': [2, 5]
    }
    rf = RandomForestClassifier(random_state=SEED, class_weight='balanced')
    gs = GridSearchCV(rf, param_grid, cv=3, scoring='accuracy')
    gs.fit(features, target, sample_weight=sample_weights)

    best_params = gs.best_params_
    best_acc = gs.best_score_
    print(f"✅ Mejores params: {best_params} (Accuracy={best_acc:.4f})")

    importances = gs.best_estimator_.feature_importances_
    feat_names = features.columns
    print("📊 Importancia de variables:")
    for name, imp in sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True):
        print(f"  {name}: {imp:.4f}")

    best_rf = RandomForestRecommender()
    best_rf.clf = gs.best_estimator_
    best_rf.le_topic = le_topic
    best_rf.difficulty_order = diff_map
    best_rf.trained = True
    best_rf.scaler_S = scaler_S
    return best_rf, best_params, best_acc

# ------------------------------------------------------------
# Evaluación final (utilidad como relevancia)
# ------------------------------------------------------------
def evaluate_on_test(models, test_interactions, questions_df, k_values=[5, 10, 20]):
    # Cargar formatos para preferencias
    resources_path = os.path.join(DATA_DIR, 'resources.json')
    if os.path.exists(resources_path):
        with open(resources_path, 'r', encoding='utf-8') as f:
            resources = json.load(f)
        qid_to_fmt = {}
        for _, row in questions_df.iterrows():
            rid = row.get('resource_id', '')
            if rid in resources:
                qid_to_fmt[row['id']] = resources[rid].get('format', 'text')
            else:
                qid_to_fmt[row['id']] = 'text'
    else:
        qid_to_fmt = {}

    results = {name: {} for name in models}
    user_groups = test_interactions.groupby('uid')

    for k in k_values:
        print(f"\n--- Evaluando con k={k} ---")
        for name, model in models.items():
            precs, recs = [], []
            mrr_list, ndcg_list = [], []
            for uid, grp in user_groups:
                # Calcular delta_a para definir relevancia (utilidad)
                grp = grp.copy()
                grp['delta_a'] = grp.apply(lambda row: row['S_after']['a'] - row['S_before']['a'], axis=1)
                relevant = set(grp[grp['delta_a'] > 0.02]['question_id'].tolist())
                if not relevant:
                    continue

                last_row = grp.sort_values('attempts').iloc[-1]
                S = last_row['S_after']
                topic = grp['topic'].mode().iloc[0]
                user_prefs = last_row.get('preferences', [])
                if isinstance(user_prefs, str):
                    try:
                        user_prefs = ast.literal_eval(user_prefs)
                    except:
                        user_prefs = []

                try:
                    if name == 'knn':
                        recs_ids = model.recommend(
                            S, topic, questions_df, top_n=k, filter_seen=False,
                            user_prefs=user_prefs, qid_to_format=qid_to_fmt
                        )
                    elif name == 'svd':
                        recs_ids = model.recommend(
                            uid, topic, questions_df, top_n=k,
                            user_prefs=user_prefs, qid_to_format=qid_to_fmt
                        )
                    elif name == 'rf':
                        recs_ids = model.recommend(S, topic, questions_df, top_n=k)
                    else:
                        recs_ids = []
                except:
                    recs_ids = []

                # Relleno determinista por dificultad
                if len(recs_ids) < k:
                    topic_qids = questions_df[questions_df['topic'] == topic]['id'].tolist()
                    remaining_ids = [qid for qid in topic_qids if qid not in recs_ids]
                    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
                    qid_to_diff = dict(zip(questions_df['id'], questions_df['difficulty'].map(diff_order).fillna(1)))
                    remaining_ids.sort(key=lambda qid: qid_to_diff.get(qid, 1))
                    extra = remaining_ids[:k - len(recs_ids)]
                    recs_ids.extend(extra)

                recs_ids = [r for r in recs_ids if r is not None]
                if recs_ids:
                    hit = len(set(recs_ids) & relevant)
                    precs.append(hit / min(k, len(recs_ids)))
                    recs.append(hit / len(relevant))
                    # MRR
                    for i, qid in enumerate(recs_ids, start=1):
                        if qid in relevant:
                            mrr_list.append(1.0 / i)
                            break
                    else:
                        mrr_list.append(0.0)
                    # NDCG
                    rels = [1 if qid in relevant else 0 for qid in recs_ids]
                    dcg = sum(r / np.log2(2 + i) for i, r in enumerate(rels[:k]))
                    ideal = sorted(rels, reverse=True)[:k]
                    idcg = sum(r / np.log2(2 + i) for i, r in enumerate(ideal))
                    ndcg = dcg / idcg if idcg > 0 else 0.0
                    ndcg_list.append(ndcg)

            avg_prec = np.mean(precs) if precs else 0
            avg_rec = np.mean(recs) if recs else 0
            avg_mrr = np.mean(mrr_list) if mrr_list else 0
            avg_ndcg = np.mean(ndcg_list) if ndcg_list else 0

            results[name][f'Precision@{k}'] = avg_prec
            results[name][f'Recall@{k}'] = avg_rec
            results[name][f'MRR@{k}'] = avg_mrr
            results[name][f'NDCG@{k}'] = avg_ndcg
            print(f"  {name:5s}: P@{k}={avg_prec:.4f}  R@{k}={avg_rec:.4f}  MRR@{k}={avg_mrr:.4f}  NDCG@{k}={avg_ndcg:.4f}")
    return results

# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
def main():
    print("=" * 60)
    print("🚀 Entrenamiento avanzado con mejoras (utilidad, preferencias, ruido)")
    print("=" * 60)
    questions_df = load_questions()
    resource_fmt_map = load_resource_formats()
    print(f"Preguntas cargadas: {len(questions_df)}")
    users = generate_synthetic_users(300)
    print(f"Usuarios sintéticos: {len(users)}")
    inter_df = simulate_interactions_advanced(users, questions_df, resource_fmt_map, n_inter=60)
    inter_df = add_recency_weights(inter_df, decay=0.1)
    print(f"Interacciones generadas: {len(inter_df)}")

    user_ids = [u['user_id'] for u in users]
    train_uids, test_uids = train_test_split(user_ids, test_size=0.2, random_state=SEED)
    train_inter = inter_df[inter_df['uid'].isin(train_uids)].copy()
    test_inter = inter_df[inter_df['uid'].isin(test_uids)].copy()
    train_inter.to_csv(os.path.join(DATA_DIR, 'train_interactions.csv'), index=False)
    test_inter.to_csv(os.path.join(DATA_DIR, 'test_interactions.csv'), index=False)

    sub_uids, val_uids = train_test_split(train_uids, test_size=0.2, random_state=SEED)
    sub_train_inter = train_inter[train_inter['uid'].isin(sub_uids)].copy()
    val_inter = train_inter[train_inter['uid'].isin(val_uids)].copy()
    val_users_list = [u for u in users if u['user_id'] in val_uids]

    knn_model, best_k, best_knn_prec = train_best_knn(sub_train_inter, val_users_list, val_inter, questions_df)
    knn_model.save(os.path.join(MODEL_DIR, 'knn_model.pkl'))

    svd_model, best_svd_params, best_svd_rmse = train_best_svd(sub_train_inter)
    svd_model.save(os.path.join(MODEL_DIR, 'svd_model.pkl'))

    rf_model, best_rf_params, best_rf_acc = train_best_rf(sub_train_inter)
    rf_model.save(os.path.join(MODEL_DIR, 'rf_model.pkl'))

    print("\n📊 Evaluación final sobre el test set independiente:")
    models = {'knn': knn_model, 'svd': svd_model, 'rf': rf_model}
    test_metrics = evaluate_on_test(models, test_inter, questions_df, k_values=[5, 10, 20])

    report_path = os.path.join(MODEL_DIR, 'evaluation_report.txt')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("EduAdapt AI – Evaluación final (mejorado)\n")
        f.write("=" * 40 + "\n")
        f.write(f"Usuarios: {len(users)} | Interacciones: {len(inter_df)}\n")
        f.write(f" KNN: k={best_k} (Precision val = {best_knn_prec:.4f})\n")
        f.write(f" SVD: {best_svd_params} (RMSE = {best_svd_rmse:.4f})\n")
        f.write(f" RF : {best_rf_params} (Accuracy val = {best_rf_acc:.4f})\n\n")
        for k in [5, 10, 20]:
            f.write(f"\n--- k={k} ---\n")
            for name in models:
                p = test_metrics[name].get(f'Precision@{k}', 0)
                r = test_metrics[name].get(f'Recall@{k}', 0)
                m = test_metrics[name].get(f'MRR@{k}', 0)
                n = test_metrics[name].get(f'NDCG@{k}', 0)
                f.write(f"{name}: P@{k}={p:.4f}, R@{k}={r:.4f}, MRR@{k}={m:.4f}, NDCG@{k}={n:.4f}\n")
    print(f"\n📄 Reporte guardado en {report_path}")

if __name__ == '__main__':
    main()