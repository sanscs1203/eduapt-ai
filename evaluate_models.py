import os, sys, ast, json, pickle, warnings, random
import numpy as np
import pandas as pd
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from recommenders.knn_recommender import KNNByS
from recommenders.svd_recommender import SVDRecommender
from recommenders.random_forest_rec import RandomForestRecommender

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

warnings.filterwarnings('ignore')
MODEL_DIR = os.path.join('models', 'saved')
DATA_DIR = os.path.join('data')
QUESTIONS_PATH = os.path.join(DATA_DIR, 'algebra_questions_expanded.json')
RESOURCES_PATH = os.path.join(DATA_DIR, 'resources.json')
TEST_CSV = os.path.join(DATA_DIR, 'test_interactions.csv')

K_VALUES = [5, 10, 20]

def load_questions():
    with open(QUESTIONS_PATH, 'r', encoding='utf-8') as f:
        qdict = json.load(f)
    questions = []
    for topic, qs in qdict.items():
        for q in qs:
            q['topic'] = topic
            questions.append(q)
    return pd.DataFrame(questions)

def load_resource_format_map():
    if not os.path.exists(RESOURCES_PATH):
        return {}
    with open(RESOURCES_PATH, 'r', encoding='utf-8') as f:
        resources = json.load(f)
    questions_df = load_questions()
    qid_to_fmt = {}
    for _, row in questions_df.iterrows():
        rid = row.get('resource_id', '')
        if rid in resources:
            qid_to_fmt[row['id']] = resources[rid].get('format', 'text')
        else:
            qid_to_fmt[row['id']] = 'text'
    return qid_to_fmt

def load_models():
    models = {}
    path_knn = os.path.join(MODEL_DIR, 'knn_model.pkl')
    if os.path.exists(path_knn):
        knn = KNNByS()
        knn.load(path_knn)
        models['knn'] = knn
        print("✅ KNN cargado")

    path_svd = os.path.join(MODEL_DIR, 'svd_model.pkl')
    if os.path.exists(path_svd):
        svd = SVDRecommender()
        try:
            svd.load(path_svd)
            print(f"✅ SVD cargado")
            models['svd'] = svd
        except Exception as e:
            print(f"❌ Error al cargar SVD: {e}")

    path_rf = os.path.join(MODEL_DIR, 'rf_model.pkl')
    if os.path.exists(path_rf):
        with open(path_rf, 'rb') as f:
            rf = pickle.load(f)
        models['rf'] = rf
        print("✅ Random Forest cargado")
    return models

def ensure_dict_columns(df):
    for col in ['S_before', 'S_after']:
        if col not in df.columns:
            continue
        def safe_convert(x):
            if isinstance(x, dict):
                return x
            if not isinstance(x, str):
                return {}
            x_clean = x.replace(': nan', ': null').replace(': inf', ': null').replace(': -inf', ': null')
            try:
                return json.loads(x_clean)
            except:
                try:
                    return ast.literal_eval(x_clean)
                except:
                    return {}
        df[col] = df[col].apply(safe_convert)
    if 'preferences' in df.columns:
        def parse_prefs(x):
            if isinstance(x, list):
                return x
            if isinstance(x, str):
                try:
                    return ast.literal_eval(x)
                except:
                    return []
            return []
        df['preferences'] = df['preferences'].apply(parse_prefs)
    return df

def dcg_at_k(rels, k):
    rels = np.array(rels)[:k]
    if rels.size == 0:
        return 0.0
    discounts = np.log2(np.arange(2, rels.size + 2))
    return np.sum(rels / discounts)

def ndcg_at_k(rels, k):
    dcg = dcg_at_k(rels, k)
    ideal_rels = sorted(rels, reverse=True)[:k]
    idcg = dcg_at_k(ideal_rels, k)
    return dcg / idcg if idcg > 0 else 0.0

def mrr(recs_ids, relevant):
    for i, qid in enumerate(recs_ids, start=1):
        if qid in relevant:
            return 1.0 / i
    return 0.0

def evaluate_models(models, test_df, questions_df, qid_to_fmt, k_values=K_VALUES):
    results = {name: {} for name in models}
    user_groups = test_df.groupby('uid')

    for k in k_values:
        print(f"\n--- Evaluando con k = {k} ---")
        for name, model in models.items():
            precs_list, recalls_list = [], []
            mrr_list, ndcg_list = [], []

            for uid, grp in user_groups:
                # Calcular delta_a para relevancia
                grp = grp.copy()
                grp['delta_a'] = grp.apply(lambda row: row['S_after']['a'] - row['S_before']['a'], axis=1)
                relevant = set(grp[grp['delta_a'] > 0.02]['question_id'].tolist())
                if not relevant:
                    continue

                last_row = grp.sort_values('attempts').iloc[-1]
                S = last_row['S_after']
                topic = grp['topic'].mode().iloc[0] if not grp['topic'].empty else 'factorizacion'
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
                except Exception as e:
                    print(f"  ⚠️ Error en {name} para {uid}: {e}")
                    recs_ids = []

                recs_ids = [r for r in recs_ids if r is not None]

                if len(recs_ids) < k:
                    topic_qids = questions_df[questions_df['topic'] == topic]['id'].tolist()
                    remaining_ids = [qid for qid in topic_qids if qid not in recs_ids]
                    diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}
                    qid_to_diff = dict(zip(questions_df['id'], questions_df['difficulty'].map(diff_order).fillna(1)))
                    remaining_ids.sort(key=lambda qid: qid_to_diff.get(qid, 1))
                    extra = remaining_ids[:k - len(recs_ids)]
                    recs_ids.extend(extra)

                if recs_ids:
                    hits = len(set(recs_ids) & relevant)
                    precs_list.append(hits / min(k, len(recs_ids)))
                    recalls_list.append(hits / len(relevant))
                    mrr_list.append(mrr(recs_ids, relevant))
                    rels = [1 if qid in relevant else 0 for qid in recs_ids]
                    ndcg_list.append(ndcg_at_k(rels, k))

            avg_prec = np.mean(precs_list) if precs_list else 0.0
            avg_rec = np.mean(recalls_list) if recalls_list else 0.0
            avg_mrr = np.mean(mrr_list) if mrr_list else 0.0
            avg_ndcg = np.mean(ndcg_list) if ndcg_list else 0.0

            results[name][f'Precision@{k}'] = avg_prec
            results[name][f'Recall@{k}'] = avg_rec
            results[name][f'MRR@{k}'] = avg_mrr
            results[name][f'NDCG@{k}'] = avg_ndcg

            print(f"  {name:5s}: Precision@{k} = {avg_prec:.4f}  |  Recall@{k} = {avg_rec:.4f}  |  MRR@{k} = {avg_mrr:.4f}  |  NDCG@{k} = {avg_ndcg:.4f}")

    return results

def main():
    print("=" * 60)
    print("📊 Evaluación de modelos (utilidad como relevancia)")
    print("=" * 60)
    questions_df = load_questions()
    qid_to_fmt = load_resource_format_map()
    test_df = pd.read_csv(TEST_CSV)
    test_df = ensure_dict_columns(test_df)
    models = load_models()
    if not models:
        print("No hay modelos cargados.")
        return

    results = evaluate_models(models, test_df, questions_df, qid_to_fmt)

    os.makedirs(MODEL_DIR, exist_ok=True)
    report_path = os.path.join(MODEL_DIR, 'evaluation_report.txt')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("EduAdapt AI – Evaluación de modelos (standalone)\n")
        f.write("=" * 40 + "\n")
        f.write(f"Preguntas cargadas: {len(questions_df)}\n")
        f.write(f"Usuarios en test: {test_df['uid'].nunique()}\n")
        f.write(f"Interacciones en test: {len(test_df)}\n\n")
        for k in K_VALUES:
            f.write(f"\n--- k={k} ---\n")
            for name in models:
                p = results[name].get(f'Precision@{k}', 0)
                r = results[name].get(f'Recall@{k}', 0)
                m = results[name].get(f'MRR@{k}', 0)
                n = results[name].get(f'NDCG@{k}', 0)
                f.write(f"{name}: Precision@{k}={p:.4f}, Recall@{k}={r:.4f}, MRR@{k}={m:.4f}, NDCG@{k}={n:.4f}\n")
    print(f"\n📄 Reporte guardado en {report_path}")

if __name__ == '__main__':
    main()