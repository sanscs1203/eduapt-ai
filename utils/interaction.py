import json
import random
import numpy as np
from pathlib import Path
from collections import defaultdict

# ------------------------------------------------------------
# CONFIGURACIÓN (aumentada)
# ------------------------------------------------------------
N_STUDENTS = 800                
MAX_SESSIONS = 6
MIN_INTERACTIONS = 5
MAX_INTERACTIONS = 20           
TOPICS = [
    "polinomios", "fracciones", "ecuaciones", "sistemas",
    "factorizacion", "potencias", "radicales", "logaritmos",
    "funciones", "inecuaciones"
]
INTENTS = ["EXPLAIN", "PRACTICE", "DOUBT", "QUIZ", "CASUAL"]
DIFFICULTY_MAP = {"Easy": 0, "Medium": 1, "Hard": 2}

# ------------------------------------------------------------
# 1. CARGA DE ÍTEMS
# ------------------------------------------------------------
def load_items():
    base = Path("data")
    with open(base / "algebra_questions.json", "r", encoding="utf-8") as f:
        questions_raw = json.load(f)
    with open(base / "resources.json", "r", encoding="utf-8") as f:
        resources_raw = json.load(f)

    items = []
    topic_fix = {
        "sistemas_ecuaciones": "sistemas",
        "fracciones_algebraicas": "fracciones"
    }

    for qid, qdata in questions_raw.items():
        topic = qdata.get("topic", "")
        topic = topic_fix.get(topic, topic)
        if topic not in TOPICS:
            continue
        items.append({
            "item_id": qid,
            "topic": topic,
            "difficulty": qdata.get("difficulty", "Medium"),
            "type": "question"
        })

    for rid, rdata in resources_raw.items():
        topic = rdata.get("topic", "")
        topic = topic_fix.get(topic, topic)
        if topic not in TOPICS:
            continue
        items.append({
            "item_id": rid,
            "topic": topic,
            "difficulty": rdata.get("difficulty", "Medium"),
            "type": "resource"
        })

    return items

# ------------------------------------------------------------
# 2. INICIALIZACIÓN DE ESTUDIANTES
# ------------------------------------------------------------
def init_student():
    profile = {}
    for t in TOPICS:
        profile[t] = {
            "mastery": round(np.random.beta(2, 5), 4),
            "streak": 0,
            "attempts": 0,
            "correct": 0
        }
    return profile

# ------------------------------------------------------------
# 3. ASIGNACIÓN DE INTENCIÓN
# ------------------------------------------------------------
def sample_intent(item_type):
    if item_type == "question":
        return random.choice(["PRACTICE", "QUIZ"])
    else:
        return random.choice(["EXPLAIN", "DOUBT", "CASUAL"])

# ------------------------------------------------------------
# 4. CÁLCULO DE SUITABILITY (con ruido)
# ------------------------------------------------------------
def calculate_suitability(mastery, difficulty_num, item_type, intent):
    optimal_diff_value = 2 * (1 - mastery)   # 0 = Easy, 2 = Hard
    diff_distance = abs(difficulty_num - optimal_diff_value) / 2.0
    base_score = 1.0 - diff_distance

    if item_type == "question" and intent in ["PRACTICE", "QUIZ"]:
        base_score += 0.1
    elif item_type == "resource" and intent in ["EXPLAIN", "DOUBT"]:
        base_score += 0.1

    base_score += np.random.normal(0, 0.05)
    return np.clip(base_score, 0.0, 1.0)

# ------------------------------------------------------------
# 5. GENERACIÓN DE INTERACCIONES
# ------------------------------------------------------------
def generate_interactions(items):
    all_interactions = []
    rng = random.Random(42)
    students = {f"syn_{i:03d}": init_student() for i in range(N_STUDENTS)}
    items_by_topic = defaultdict(list)
    for it in items:
        items_by_topic[it["topic"]].append(it)

    for uid, profile in students.items():
        n_sessions = rng.randint(1, MAX_SESSIONS + 1)
        for _ in range(n_sessions):
            session_topics = rng.sample(TOPICS, k=rng.randint(1, 3))
            n_int = rng.randint(MIN_INTERACTIONS, MAX_INTERACTIONS + 1)
            for _ in range(n_int):
                topic = rng.choice(session_topics)
                item = rng.choice(items_by_topic[topic])
                difficulty_num = DIFFICULTY_MAP[item["difficulty"]]
                item_type = item["type"]

                mastery_before = profile[topic]["mastery"]
                streak_before = profile[topic]["streak"]
                intent = sample_intent(item_type)

                suitability = calculate_suitability(mastery_before, difficulty_num, item_type, intent)

                # Simular respuesta y actualizar perfil
                if item_type == "question":
                    if difficulty_num == 0: th, sl = 0.4, 12
                    elif difficulty_num == 1: th, sl = 0.55, 10
                    else: th, sl = 0.7, 8
                    prob = 1 / (1 + np.exp(-sl * (mastery_before - th)))
                    prob = np.clip(prob, 0.02, 0.98)
                    correct = 1 if rng.random() < prob else 0
                    if correct:
                        profile[topic]["correct"] += 1
                        profile[topic]["streak"] = max(profile[topic]["streak"] + 1, 0)
                        gain = 0.12 * (1 - profile[topic]["mastery"])
                        profile[topic]["mastery"] = round(min(profile[topic]["mastery"] + gain, 1.0), 4)
                    else:
                        profile[topic]["streak"] = -1
                        loss = 0.08 * profile[topic]["mastery"]
                        profile[topic]["mastery"] = round(max(profile[topic]["mastery"] - loss, 0.01), 4)
                else:
                    gain = 0.15 * (1 - profile[topic]["mastery"])
                    profile[topic]["mastery"] = round(min(profile[topic]["mastery"] + gain, 1.0), 4)

                interaction = {
                    "uid": uid,
                    "item_id": item["item_id"],
                    "topic": topic,
                    "difficulty": item["difficulty"],
                    "difficulty_num": difficulty_num,
                    "item_type": item_type,
                    "intent": intent,
                    "mastery_before": mastery_before,
                    "streak_before": streak_before,
                    "suitability": round(suitability, 4)
                }
                all_interactions.append(interaction)

    return all_interactions, list(students.keys()), students

# ------------------------------------------------------------
# 6. DIVISIÓN Y GUARDADO DE PERFILES
# ------------------------------------------------------------
def save_splits(interactions, uids):
    rng = random.Random(42)
    uids_shuffled = uids[:]
    rng.shuffle(uids_shuffled)
    split_idx = int(len(uids_shuffled) * 0.8)
    train_uids = set(uids_shuffled[:split_idx])
    test_uids = set(uids_shuffled[split_idx:])

    train_data = [i for i in interactions if i["uid"] in train_uids]
    test_data = [i for i in interactions if i["uid"] in test_uids]

    base = Path("data")
    with open(base / "synthetic_train.json", "w", encoding="utf-8") as f:
        json.dump(train_data, f, indent=2, ensure_ascii=False)
    with open(base / "synthetic_test.json", "w", encoding="utf-8") as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)

    print(f"Entrenamiento: {len(train_data)} interacciones de {len(train_uids)} usuarios")
    print(f"Test:          {len(test_data)} interacciones de {len(test_uids)} usuarios")
    return train_uids, test_uids

def save_test_profiles(uids_test, students):
    profiles = {}
    for uid in uids_test:
        profiles[uid] = students[uid]
    with open(Path("data") / "student_profiles_test.json", "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=2, ensure_ascii=False)
    print(f"Perfiles de {len(profiles)} estudiantes de test guardados en data/student_profiles_test.json")

# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
if __name__ == "__main__":
    print("Cargando preguntas y recursos...")
    items = load_items()
    print(f"Ítems cargados: {len(items)}")
    print("Generando interacciones sintéticas...")
    interactions, uids, students = generate_interactions(items)
    train_uids, test_uids = save_splits(interactions, uids)
    save_test_profiles(test_uids, students)
    print("✅ Archivos generados correctamente.")