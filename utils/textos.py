import json
import random
import os
import uuid
from datetime import datetime

SEED = 42
random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, "data", "nlp_training_data_pro.json")

TARGET_SIZE = 1000000

INTENT_DISTRIBUTION = {
    "GREETING": 0.08,
    "ABOUT": 0.06,
    "EXPLAIN": 0.26,
    "PRACTICE": 0.20,
    "DOUBT": 0.18,
    "QUIZ": 0.08,
    "CASUAL": 0.07,
    "GOODBYE": 0.03,
    "THANKS": 0.03,
    "UNKNOWN": 0.01
}

TEMAS_MAP = {
    "polinomios": ["polinomios", "monomios", "binomios", "trinomios", "suma de polinomios", "resta de polinomios", "multiplicar expresiones", "productos notables", "diferencia de cuadrados", "binomio cuadrado perfecto", "trinomio cuadrado perfecto", "operaciones con monomios", "un solo termino"],
    "fracciones": ["fracciones", "fracciones algebraicas", "simplificar fracciones", "sumar fracciones", "restar fracciones", "multiplicar fracciones", "dividir fracciones"],
    "ecuaciones": ["ecuaciones", "resolver ecuaciones", "hallar la x", "encontrar el valor de x", "despeje", "despejar", "aislar la x", "despejar la variable", "dejar la x sola", "ecuaciones cuadraticas", "ecuaciones de segundo grado", "formula general", "la chicharronera", "valor absoluto", "ecuaciones con valor absoluto", "modulos"],
    "sistemas": ["sistemas de ecuaciones", "ecuaciones 2x2", "metodo de sustitucion", "metodo de igualacion", "metodo de eliminacion", "2 variables", "sistemas lineales"],
    "factorizacion": ["factorizacion", "factorizar", "descomponer en factores", "factor comun", "factor comun por agrupacion", "trinomio cuadrado perfecto", "diferencia de cuadrados"],
    "potencias": ["potencias", "leyes de exponentes", "exponentes", "elevar al cuadrado", "potencias algebraicas", "potencias con fracciones"],
    "radicales": ["radicales", "raices", "simplificar raices", "raiz cuadrada", "raiz cubica", "operaciones con radicales"],
    "logaritmos": ["logaritmos", "propiedades de logaritmos", "log", "logaritmo natural", "ln", "ecuaciones logaritmicas"],
    "funciones": ["funciones", "dominio y rango", "graficar funciones", "f de x", "funcion lineal", "linea recta", "pendiente de la recta", "y = mx + b", "funcion cuadratica", "parabolas", "vertice de la parabola"],
    "inecuaciones": ["inecuaciones", "desigualdades", "mayor que menor que", "intervalos", "abierto y cerrado", "conjuntos numericos", "representacion en la recta"]
}
TEMAS = list(TEMAS_MAP.keys())

EXPRESIONES = ["x^2 + 5x + 6", "2x + 3 = 9", "(x+2)(x-3)", "x^2 - 9", "3x - 7 = 11", "x^2 + 4x + 4", "5x + 8 = 18", "2x^2 + 8x", "x^2 - 4x - 12", "(x+5)", "|x - 3|", "log(x)", "2x - 5 > 9", "x/2 + 4 = 10", "x^2 - 25"]

SALUDOS = ["hola", "hey", "profe", "parce", "mano", "bro", "disculpa", "oiga", "", ""]
CONECTORES = ["es que", "la verdad", "ando viendo", "no entiendo", "ando perdido", "estoy intentando", "me perdi", "", ""]
EMOJIS = ["", "", "😭", "😔", "😅", "🙏", "💀", "xd"]
CORTESIAS = ["por favor", "porfa", "si puedes", "cuando puedas", "te lo agradeceria", ""]

INTENCIONES = {
    "GREETING": ["hola", "holaaa", "buenas", "hey", "como vas", "que tal", "alguien ahi", "holi", "eyyy", "hola bot", "buenos dias", "buenas noches"],
    "ABOUT": ["quien eres", "que puedes hacer", "eres una ia", "como funcionas", "para que sirves", "como ayudas a estudiar", "eres un chatbot", "que sabes hacer", "me puedes ayudar a estudiar", "como me puedes ayudar"],
    "EXPLAIN": ["me explicas {}", "no entiendo {}", "que es {}", "como funciona {}", "enseñame {}", "explica {} paso a paso", "quiero aprender {}", "dame teoria de {}", "ayudame a entender {}", "como se hace {}", "profe no entiendo {}", "me perdi en {}", "puedes volver a explicar {}", "explicame otra vez {}", "no cacho {}", "como sabes cuando usar {}", "explicame el tema de {}"],
    "PRACTICE": ["ponme ejercicios de {}", "quiero practicar {}", "dame problemas de {}", "reto de {}", "manda tarea de {}", "ejercicio dificil de {}", "ponme a practicar {}", "quiero resolver ejercicios de {}", "dame algo de {}", "quiero mas ejercicios de {}", "ponme ejercicios similares de {}", "quiero practicar con ejercicios", "dame ejercicios resueltos de {}"],
    "DOUBT": ["tengo una duda de {}", "por que da eso en {}", "esto esta bien en {}", "mi resultado esta mal en {}", "no entiendo este paso de {}", "ayuda con este ejercicio de {}", "esta correcto si hago {} asi", "como resuelvo esto de {}", "me puedes ayudar con {}", "por que cambia el signo en {}", "no se que hacer en {}", "me salio diferente en {}", "no entiendo el segundo paso de {}"],
    "QUIZ": ["hazme un quiz de {}", "ponme un test de {}", "quiero un examen de {}", "evaluame en {}", "simulacro de {}", "mini parcial de {}", "quiero medir mi nivel en {}", "haz preguntas de {}", "quiero hacer un quiz"],
    "CASUAL": ["tengo sueño", "estoy cansado", "odio algebra", "no quiero estudiar", "me quiero dormir", "estoy aburrido", "esto esta dificil", "quiero rendirme", "me duele la cabeza", "toy cansao", "no entiendo nada 😭", "algebra me mata", "ya no puedo mas"],
    "GOODBYE": ["chao", "adios", "bye", "nos vemos", "hasta luego", "me voy", "hasta mañana", "ya termine", "gracias bye"],
    "THANKS": ["gracias", "muchas gracias", "thanks", "te agradezco", "graciasss", "ya entendi gracias", "me ayudaste mucho", "sos crack", "gracias por la ayuda"],
    "UNKNOWN": ["pon musica", "abre youtube", "quiero jugar", "que clima hace", "cuanto es 2+2", "pon una cancion", "quiero ver memes", "busca peliculas", "que hora es", "como esta barranquilla"]
}

MENSAJES_REALES = [("no entiendo nada 😭", "CASUAL"), ("profe me perdi completamente", "CASUAL"), ("me puedes explicar eso otra vez", "EXPLAIN"), ("ponme algo dificil", "PRACTICE"), ("hazme un quiz", "QUIZ"), ("esto esta bien?", "DOUBT"), ("como hago este ejercicio", "DOUBT"), ("gracias profe", "THANKS"), ("ya entendiii", "THANKS"), ("bye bot", "GOODBYE"), ("ayudame con esto pls", "DOUBT"), ("quiero practicar potencias", "PRACTICE"), ("me rindo 💀", "CASUAL"), ("como puedo resolver este ejercicio", "DOUBT"), ("no se como empezar el ejercicio", "DOUBT"), ("explicame binomio cuadrado perfecto", "EXPLAIN"), ("hazme preguntas de funciones", "QUIZ"), ("quiero ejercicios de ecuaciones", "PRACTICE"), ("gracias por tu ayuda", "THANKS"), ("ya puedo seguir con el siguiente tema", "THANKS")]
FRASES_AMBIGUAS = [("ayuda", "DOUBT"), ("no entiendo", "EXPLAIN"), ("explicame", "EXPLAIN"), ("quiz", "QUIZ"), ("ejercicios", "PRACTICE"), ("gracias", "THANKS"), ("bye", "GOODBYE"), ("hola", "GREETING")]

TYPO_RULES = {"que": ["q", "k", "ke"], "quiero": ["kiero", "qro"], "porque": ["xq", "porq"], "explicame": ["esplikame", "explicameee"], "hola": ["ola", "holaa", "holi"]}

# ----------------------------------------------------------------------
# FUNCIONES AUXILIARES
# ----------------------------------------------------------------------
def aplicar_typos(texto):
    palabras = texto.split()
    for i, palabra in enumerate(palabras):
        if random.random() < 0.08:
            for original, variantes in TYPO_RULES.items():
                if original in palabra.lower():
                    palabras[i] = palabra.lower().replace(original, random.choice(variantes))
    return " ".join(palabras)

def errores_teclado(texto):
    if random.random() > 0.04:
        return texto
    chars = list(texto)
    if len(chars) < 4:
        return texto
    idx = random.randint(1, len(chars)-2)
    chars[idx], chars[idx+1] = chars[idx+1], chars[idx]
    return "".join(chars)

def aplicar_ruido(texto):
    if random.random() < 0.12:
        texto += " " + random.choice(EMOJIS)
    if random.random() < 0.06:
        texto += random.choice(["!!!", "???", "..."])
    rng = random.random()
    if rng < 0.03:
        texto = texto.upper()
    elif rng < 0.06:
        texto = texto.capitalize()
    return texto.strip()

def generar_metadata(intent, topic, texto):
    return {
        "id": str(uuid.uuid4()),
        "text": texto,
        "intent": intent,
        "topic": topic,
        "difficulty": random.choice(["easy", "medium", "hard"]),
        "source": "synthetic",
        "language": "es",
        "created_at": datetime.utcnow().isoformat()
    }

def insertar_expresion(frase):
    if "{}" in frase:
        return frase
    if random.random() < 0.18:
        expresion = random.choice(EXPRESIONES)
        frase += f" como {expresion}"
    return frase

# ----------------------------------------------------------------------
# GENERACIÓN DE FRASE ACADÉMICA BASE (sin sociales)
# ----------------------------------------------------------------------
def generar_frase_academica(intent_academico):
    plantilla = random.choice(INTENCIONES[intent_academico])
    tema_clave = random.choice(TEMAS)
    variante = random.choice(TEMAS_MAP[tema_clave])
    frase = plantilla.format(variante)
    # Añadir expresión matemática ocasional
    frase = insertar_expresion(frase)
    return frase, intent_academico, tema_clave

# ----------------------------------------------------------------------
# GENERACIÓN DE FRASE MIXTA (social + académico + social)
# ----------------------------------------------------------------------
def generar_frase_mixta(intent_sorteado):
    """
    Crea una frase combinando elementos sociales y académicos.
    El intent resultante será siempre el académico (EXPLAIN, PRACTICE, DOUBT, QUIZ, ABOUT).
    Se puede añadir:
    - Prefijo: GREETING o GOODBYE (raro)
    - Sufijo: THANKS o CASUAL
    También se pueden añadir cortesías tipo "por favor".
    """
    # Elegir intent académico principal (puede ser también ABOUT)
    academicos = ["EXPLAIN", "PRACTICE", "DOUBT", "QUIZ", "ABOUT"]
    intent_academico = random.choice(academicos)
    frase_academica, _, tema_clave = generar_frase_academica(intent_academico)

    # Construir partes sociales según el intent sorteado inicial (puede ser cualquier social)
    prefijo = ""
    sufijo = ""
    
    # Si el intent sorteado es GREETING o GOODBYE, añadimos prefijo
    if intent_sorteado in ["GREETING", "GOODBYE"]:
        if intent_sorteado == "GREETING":
            prefijo = random.choice(INTENCIONES["GREETING"]).capitalize()
        else:  # GOODBYE (menos común, pero puede ser "antes de irme, ...")
            prefijo = random.choice(INTENCIONES["GOODBYE"]).capitalize()
        prefijo += random.choice([", ", ". ", " ¡Hola! ", " "])
    
    # Si el intent sorteado es THANKS, añadimos sufijo de agradecimiento
    if intent_sorteado == "THANKS":
        sufijo = ", " + random.choice(INTENCIONES["THANKS"])
    
    # Si el intent sorteado es CASUAL, añadimos una frase casual al inicio o final
    if intent_sorteado == "CASUAL":
        if random.random() < 0.5:
            prefijo = random.choice(INTENCIONES["CASUAL"]).capitalize() + ". "
        else:
            sufijo = " " + random.choice(INTENCIONES["CASUAL"])
    
    # Añadir cortesía "por favor" con cierta probabilidad
    cortesia = random.choice(CORTESIAS)
    if cortesia and random.random() < 0.4:
        if random.random() < 0.5:
            frase_academica = cortesia + " " + frase_academica
        else:
            frase_academica = frase_academica + ", " + cortesia
    
    # Ensamblar
    frase = prefijo + frase_academica + sufijo
    frase = " ".join(frase.split())
    # Aplicar ruido
    frase = aplicar_typos(frase)
    frase = errores_teclado(frase)
    frase = aplicar_ruido(frase)
    
    return generar_metadata(intent_academico, tema_clave, frase)

# ----------------------------------------------------------------------
# FRASE ORIGINAL PURA (sin mezcla)
# ----------------------------------------------------------------------
def generar_frase_pura(intent):
    plantilla = random.choice(INTENCIONES[intent])
    if intent in ["GREETING", "ABOUT", "CASUAL", "GOODBYE", "THANKS", "UNKNOWN"]:
        frase = plantilla
        topic = "social"
    else:
        tema_clave = random.choice(TEMAS)
        variante = random.choice(TEMAS_MAP[tema_clave])
        saludo = random.choice(SALUDOS)
        conector = random.choice(CONECTORES)
        frase = f"{saludo} {conector} {plantilla.format(variante)}"
        frase = insertar_expresion(frase)
        topic = tema_clave
    frase = " ".join(frase.split())
    frase = aplicar_typos(frase)
    frase = errores_teclado(frase)
    frase = aplicar_ruido(frase)
    return generar_metadata(intent, topic, frase)

# ----------------------------------------------------------------------
# PUNTO DE ENTRADA PARA GENERAR FRASE SEGÚN INTENT SORTEADO
# ----------------------------------------------------------------------
def generar_frase(intent):
    # Si el intent es social, con probabilidad 0.7 generar mixta (social + académico)
    if intent in ["GREETING", "GOODBYE", "THANKS", "CASUAL"] and random.random() < 0.7:
        return generar_frase_mixta(intent)
    # Si el intent es académico, con probabilidad 0.5 añadirle un toque social (prefijo o sufijo)
    elif intent in ["EXPLAIN", "PRACTICE", "DOUBT", "QUIZ", "ABOUT"] and random.random() < 0.5:
        # Elegir un social aleatorio para mezclar
        social = random.choice(["GREETING", "THANKS", "CASUAL"])
        return generar_frase_mixta(social)  # la función ya devuelve intent académico
    else:
        # Frase pura
        return generar_frase_pura(intent)

# ----------------------------------------------------------------------
# GENERAR DATASET COMPLETO
# ----------------------------------------------------------------------
def generar_dataset():
    dataset = []
    textos_existentes = set()
    intents = list(INTENT_DISTRIBUTION.keys())
    weights = list(INTENT_DISTRIBUTION.values())

    while len(dataset) < TARGET_SIZE:
        intent = random.choices(intents, weights=weights, k=1)[0]
        ejemplo = generar_frase(intent)
        texto_normalizado = ejemplo["text"].lower().strip()
        if texto_normalizado in textos_existentes:
            continue
        textos_existentes.add(texto_normalizado)
        dataset.append(ejemplo)
    return dataset

def guardar_dataset(dataset):
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    print("\n===================================")
    print("✅ DATASET NLP GENERADO CON MEZCLAS SOCIALES+ACADÉMICAS")
    print("===================================")
    print(f"📦 Total ejemplos: {len(dataset)}")
    print(f"📁 Archivo: {OUTPUT_PATH}")
    intents = {}
    topics = {}
    for item in dataset:
        intents[item["intent"]] = intents.get(item["intent"], 0) + 1
        if item["topic"] != "social":
            topics[item["topic"]] = topics.get(item["topic"], 0) + 1
    print("\n📊 Distribución de intents:")
    for k, v in sorted(intents.items()):
        print(f"   {k}: {v}")
    print("\n📚 Tópicos (no sociales):")
    for k, v in sorted(topics.items())[:10]:
        print(f"   {k}: {v}")

if __name__ == "__main__":
    dataset = generar_dataset()
    guardar_dataset(dataset)