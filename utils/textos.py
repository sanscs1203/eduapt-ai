import json
import random
import os
import uuid
from datetime import datetime

SEED = 42
random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, "data", "nlp_training_data_pro.json")
TEST_REAL_PATH = os.path.join(BASE_DIR, "data", "nlp_test_real_data.json")

TARGET_SIZE = 1000000

INTENT_DISTRIBUTION = {
    "GREETING": 0.10,
    "ABOUT": 0.06,
    "EXPLAIN": 0.24,
    "PRACTICE": 0.18,
    "DOUBT": 0.18,
    "QUIZ": 0.08,
    "CASUAL": 0.08,
    "GOODBYE": 0.04,
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
    "GREETING": [
        "hola", "holaaa", "buenas", "hey", "como vas", "que tal", "alguien ahi", "holi", "eyyy",
        "hola bot", "buenos dias", "buenas noches", "buenas tardes", "saludos", "que hubo",
        "que mas", "como estas", "todo bien?", "que cuentas", "que onda", "que hay",
        "buen dia", "buenas", "hola profe", "hola tutor", "hola buenas", "ey", "alo",
        "hola como estas", "buenas noches profe", "buenos dias bot", "hola amigo",
        "hola gente", "que tal todo", "como va eso", "que hay de nuevo", "hola hola"
    ],
    
        "ABOUT": [
        "quien eres", "que puedes hacer", "eres una ia", "como funcionas",
        "para que sirves", "como ayudas a estudiar", "eres un chatbot",
        "que sabes hacer", "me puedes ayudar a estudiar", "como me puedes ayudar",
        "que eres", "que tipo de ia eres", "como aprendiste", "quien te creo",
        "cual es tu proposito", "que alcance tienes", "puedes resolver cualquier ejercicio?",
        "en que temas eres bueno", "que tan inteligente eres", "como se usa esto"
    ], 
        
    "EXPLAIN": ["me explicas {}", "no entiendo {}", "que es {}", "como funciona {}", "enseñame {}", "explica {} paso a paso", "quiero aprender {}", "dame teoria de {}", "ayudame a entender {}", "como se hace {}", "profe no entiendo {}", "me perdi en {}", "puedes volver a explicar {}", "explicame otra vez {}", "no cacho {}", "como sabes cuando usar {}", "explicame el tema de {}"],
    "PRACTICE": ["ponme ejercicios de {}", "quiero practicar {}", "dame problemas de {}", "reto de {}", "manda tarea de {}", "ejercicio dificil de {}", "ponme a practicar {}", "quiero resolver ejercicios de {}", "dame algo de {}", "quiero mas ejercicios de {}", "ponme ejercicios similares de {}", "quiero practicar con ejercicios", "dame ejercicios resueltos de {}"],
    "DOUBT": ["tengo una duda de {}", "por que da eso en {}", "esto esta bien en {}", "mi resultado esta mal en {}", "no entiendo este paso de {}", "ayuda con este ejercicio de {}", "esta correcto si hago {} asi", "como resuelvo esto de {}", "me puedes ayudar con {}", "por que cambia el signo en {}", "no se que hacer en {}", "me salio diferente en {}", "no entiendo el segundo paso de {}"],
    "QUIZ": ["hazme un quiz de {}", "ponme un test de {}", "quiero un examen de {}", "evaluame en {}", "simulacro de {}", "mini parcial de {}", "quiero medir mi nivel en {}", "haz preguntas de {}", "quiero hacer un quiz"],
    
    "CASUAL": [
        "tengo sueño", "estoy cansado", "odio algebra", "no quiero estudiar",
        "me quiero dormir", "estoy aburrido", "esto esta dificil", "quiero rendirme",
        "me duele la cabeza", "toy cansao", "no entiendo nada 😭", "algebra me mata",
        "ya no puedo mas", "que pereza", "ufff", "jajaja", "que locura", "estoy perdido",
        "me aburro", "no doy mas", "estoy que me rindo", "que duro es esto",
        "ayuda que no entiendo nada", "esto es chino", "me estreso", "auxilio",
        "que sueño", "mejor me voy a dormir", "no quiero hacer nada", "que flojera"
    ],
    "GOODBYE": [
        "chao", "adios", "bye", "nos vemos", "hasta luego", "me voy", "hasta mañana",
        "ya termine", "gracias bye", "chao profe", "adios bot", "hasta pronto",
        "me despido", "buena noche", "buen dia", "que estes bien", "cuídate",
        "hablamos", "hasta la proxima", "chao chao", "adiosito", "bye bye",
        "nos pillamos", "me piro", "hasta nunqui", "chaito", "me retiro"
    ],
    "THANKS": [
        "gracias", "muchas gracias", "thanks", "te agradezco", "graciasss",
        "ya entendi gracias", "me ayudaste mucho", "sos crack", "gracias por la ayuda",
        "gracias mil", "muy amable", "te pasaste", "gracias totales", "gracias parce",
        "vale gracias", "genial gracias", "perfecto gracias", "te debo una",
        "gracias por todo", "gracias profe", "gracias bot", "muchas gracias en serio"
    ],  
    "UNKNOWN": ["pon musica", "abre youtube", "quiero jugar", "que clima hace", "cuanto es 2+2", "pon una cancion", "quiero ver memes", "busca peliculas", "que hora es", "como esta barranquilla"]
}

MENSAJES_REALES = [
    # --- ACADEMICOS: EXPLAIN (Explicaciones) ---
    {"text": "hola profe me explica q es un polinomio porfa", "intent": "EXPLAIN", "topic": "polinomios"},
    {"text": "no entiendo nada de trinomios cuadrados perfectos explicame", "intent": "EXPLAIN", "topic": "factorizacion"},
    {"text": "puedes decirme la teoria de las fracciones algebraicas?", "intent": "EXPLAIN", "topic": "fracciones"},
    {"text": "kiero saber que es una inecuacion lineal", "intent": "EXPLAIN", "topic": "inecuaciones"},
    {"text": "q significa resolver un sistema de ecuaciones de 2x2?", "intent": "EXPLAIN", "topic": "sistemas"},
    {"text": "como se saca el dominio y rango de una funcion", "intent": "EXPLAIN", "topic": "funciones"},
    {"text": "dame el concepto basico de un logaritmo natural", "intent": "EXPLAIN", "topic": "logaritmos"},
    {"text": "explicame de donde sale la ley de los exponentes en potencias", "intent": "EXPLAIN", "topic": "potencias"},
    {"text": "que pasa cuando una raiz tiene indice impar y base negativa?", "intent": "EXPLAIN", "topic": "radicales"},
    {"text": "necesito la formula para resolver ecuaciones cuadraticas", "intent": "EXPLAIN", "topic": "ecuaciones"},
    {"text": "q diferencia hay entre un monomio y un polinomio??", "intent": "EXPLAIN", "topic": "polinomios"},
    {"text": "puedes repasarme el caso de factorizacion por factor comun", "intent": "EXPLAIN", "topic": "factorizacion"},
    {"text": "definicion de fraccion propia e impropia please", "intent": "EXPLAIN", "topic": "fracciones"},
    {"text": "explicame graficamente que es una inecuacion", "intent": "EXPLAIN", "topic": "inecuaciones"},
    {"text": "q metodos existen para resolver sistemas lineales?", "intent": "EXPLAIN", "topic": "sistemas"},
    {"text": "q es una funcion inyectiva y sobreyectiva??", "intent": "EXPLAIN", "topic": "funciones"},
    {"text": "explicame la propiedad de cambio de base de los logaritmos", "intent": "EXPLAIN", "topic": "logaritmos"},
    {"text": "q es una potencia de exponente negativo?", "intent": "EXPLAIN", "topic": "potencias"},
    {"text": "defineme que es la racionalizacion de radicales", "intent": "EXPLAIN", "topic": "radicales"},
    {"text": "q es una ecuacion lineal de primer grado?", "intent": "EXPLAIN", "topic": "ecuaciones"},

    # --- ACADEMICOS: DOUBT (Dudas específicas sobre ejercicios) ---
    {"text": "tengo una duda en este ejercicio x^2 - 4 = 0 que hago", "intent": "DOUBT", "topic": "ecuaciones"},
    {"text": "si tengo 3/(x-1) + 2/x como se saca el minimo comun multiplo?", "intent": "DOUBT", "topic": "fracciones"},
    {"text": "en la operacion (2x^2)*(4x^3) los exponentes se suman o se multiplican?", "intent": "DOUBT", "topic": "potencias"},
    {"text": "me tranque factorizando x^2 + 5x + 6 no me da", "intent": "DOUBT", "topic": "factorizacion"},
    {"text": "ayuda no se como despejar y en 2x + 3y = 12", "intent": "DOUBT", "topic": "sistemas"},
    {"text": "me da error al meter un logaritmo de un numero negativo xq pasa eso?", "intent": "DOUBT", "topic": "logaritmos"},
    {"text": "en una inecuacion si divido por un numero negativo cambia el signo?", "intent": "DOUBT", "topic": "inecuaciones"},
    {"text": "la raiz de una suma es igual a la suma de las raices? me confundi", "intent": "DOUBT", "topic": "radicales"},
    {"text": "este polinomio 3x^3 - 2x + 5 cual es su grado real??", "intent": "DOUBT", "topic": "polinomios"},
    {"text": "si tengo f(x) = sqrt(x-3) el dominio incluye al 3?", "intent": "DOUBT", "topic": "funciones"},
    {"text": "como se hace el metodo de reduccion si las x no tienen el mismo numero?", "intent": "DOUBT", "topic": "sistemas"},
    {"text": "estoy haciendo una resta de polinomios y me confundo con el signo de adentro", "intent": "DOUBT", "topic": "polinomios"},
    {"text": "como simplifico x^2-9 entre x+3? se cancela la x?", "intent": "DOUBT", "topic": "fracciones"},
    {"text": "cuanto es 5 elevado a la cero? da 1 o 0?", "intent": "DOUBT", "topic": "potencias"},
    {"text": "me trabé en el caso de diferencia de cuadrados con un ejercicio", "intent": "DOUBT", "topic": "factorizacion"},
    {"text": "para la inecuacion 2x - 5 > 9 el 7 entra en la solucion?", "intent": "DOUBT", "topic": "inecuaciones"},
    {"text": "tengo una duda con log(x) + log(2) = log(10) como despejo la x?", "intent": "DOUBT", "topic": "logaritmos"},
    {"text": "se puede sumar raiz de 2 mas raiz de 3? o se queda asi?", "intent": "DOUBT", "topic": "radicales"},
    {"text": "como compruebo si x=5 es la solucion correcta de mi ecuacion?", "intent": "DOUBT", "topic": "ecuaciones"},
    {"text": "si una linea vertical corta dos puntos no es funcion verdad?", "intent": "DOUBT", "topic": "funciones"},

    # --- ACADEMICOS: PRACTICE (Pedir ejercicios) ---
    {"text": "ponme un ejercicio para practicar multiplicacion de polinomios", "intent": "PRACTICE", "topic": "polinomios"},
    {"text": "dame un problema de ecuaciones dificil para resolver ya", "intent": "PRACTICE", "topic": "ecuaciones"},
    {"text": "kiero practicar sistemas de ecuaciones 3x3 mandame uno", "intent": "PRACTICE", "topic": "sistemas"},
    {"text": "tienes talleres de fracciones algebraicas para resolver?", "intent": "PRACTICE", "topic": "fracciones"},
    {"text": "mandame ejercicios sencillos de factorizacion", "intent": "PRACTICE", "topic": "factorizacion"},
    {"text": "quiero hacer ejemplos de inecuaciones cuadraticas", "intent": "PRACTICE", "topic": "inecuaciones"},
    {"text": "ponme retos sobre funciones logaritmicas y su dominio", "intent": "PRACTICE", "topic": "funciones"},
    {"text": "dame ejercicios resueltos de potencias para guiarme", "intent": "PRACTICE", "topic": "potencias"},
    {"text": "mandame actividades de simplificar radicales paso a paso", "intent": "PRACTICE", "topic": "radicales"},
    {"text": "tienes mas problemas de aplicacion de logaritmos?", "intent": "PRACTICE", "topic": "logaritmos"},
    {"text": "dame una tarea corta de division de polinomios", "intent": "PRACTICE", "topic": "polinomios"},
    {"text": "ponme problemas de la vida real con ecuaciones lineales", "intent": "PRACTICE", "topic": "ecuaciones"},
    {"text": "mandame ejercicios de sistemas de ecuaciones por metodo de sustitucion", "intent": "PRACTICE", "topic": "sistemas"},
    {"text": "quiero practicar operaciones combinadas con fracciones algebraicas", "intent": "PRACTICE", "topic": "fracciones"},
    {"text": "generame una lista de expresiones para factorizar por trinomio", "intent": "PRACTICE", "topic": "factorizacion"},
    {"text": "necesito mas ejercicios para practicar intervalos de inecuaciones", "intent": "PRACTICE", "topic": "inecuaciones"},
    {"text": "dame un ejercicio para graficar funciones lineales basico", "intent": "PRACTICE", "topic": "funciones"},
    {"text": "ponme ejercicios sobre propiedades de la potenciacion", "intent": "PRACTICE", "topic": "potencias"},
    {"text": "mandame operaciones de sumas de radicales semejantes", "intent": "PRACTICE", "topic": "radicales"},
    {"text": "quiero practicar ecuaciones logaritmicas complejas", "intent": "PRACTICE", "topic": "logaritmos"},

    # --- ACADEMICOS: QUIZ (Pedir evaluaciones evaluadas) ---
    {"text": "hazme un quiz de factorizacion para ver si se", "intent": "QUIZ", "topic": "factorizacion"},
    {"text": "evaluame en inecuaciones con un examen de 5 preguntas", "intent": "QUIZ", "topic": "inecuaciones"},
    {"text": "quiero tomar la prueba de sistemas de ecuaciones lineales", "intent": "QUIZ", "topic": "sistemas"},
    {"text": "ponme el test de fracciones algebraicas para pasar de modulo", "intent": "QUIZ", "topic": "fracciones"},
    {"text": "estoy listo para la evaluacion final de polinomios", "intent": "QUIZ", "topic": "polinomios"},
    {"text": "hazme preguntas tipo test sobre funciones cuadraticas", "intent": "QUIZ", "topic": "funciones"},
    {"text": "kiero hacer el examen de propiedades de potencias", "intent": "QUIZ", "topic": "potencias"},
    {"text": "comencemos la evaluacion sobre simplificacion de radicales", "intent": "QUIZ", "topic": "radicales"},
    {"text": "hazme un cuestionario corto sobre logaritmos naturales", "intent": "QUIZ", "topic": "logaritmos"},
    {"text": "evaluame ecuaciones de segundo grado porfa", "intent": "QUIZ", "topic": "ecuaciones"},
    {"text": "quiero medir mi nivel con un quiz interactivo de factorizacion", "intent": "QUIZ", "topic": "factorizacion"},
    {"text": "ponme una pregunta de opcion multiple sobre inecuaciones", "intent": "QUIZ", "topic": "inecuaciones"},
    {"text": "hazme un control de lectura o conceptos de sistemas lineales", "intent": "QUIZ", "topic": "sistemas"},
    {"text": "estoy listo para el minitest de fracciones", "intent": "QUIZ", "topic": "fracciones"},
    {"text": "evaluame que tanto se de productos notables y polinomios", "intent": "QUIZ", "topic": "polinomios"},
    {"text": "quiero empezar el quiz de modelado de funciones", "intent": "QUIZ", "topic": "funciones"},
    {"text": "ponme problemas de examen de leyes de exponentes", "intent": "QUIZ", "topic": "potencias"},
    {"text": "hazme un examen sorpresa de operaciones con radicales", "intent": "QUIZ", "topic": "radicales"},
    {"text": "quiero resolver la prueba de ecuaciones exponenciales y logaritmicas", "intent": "QUIZ", "topic": "logaritmos"},
    {"text": "comencemos el test de ecuaciones lineales", "intent": "QUIZ", "topic": "ecuaciones"},

    # --- NO ACADEMICOS: GREETING (Saludos) ---
    {"text": "hola chatbot como estas", "intent": "GREETING", "topic": "social"},
    {"text": "buenas tardes profesor virtual", "intent": "GREETING", "topic": "social"},
    {"text": "hey q mas todo bien?", "intent": "GREETING", "topic": "social"},
    {"text": "holaaa hay alguien ahi?", "intent": "GREETING", "topic": "social"},
    {"text": "buenos dias bot de matematicas", "intent": "GREETING", "topic": "social"},
    {"text": "hola", "intent": "GREETING", "topic": "social"},
    {"text": "saludos cordiales para el tutor virtual", "intent": "GREETING", "topic": "social"},
    {"text": "hello como va el dia", "intent": "GREETING", "topic": "social"},
    {"text": "buenas buenas", "intent": "GREETING", "topic": "social"},
    {"text": "hola amigo virtual listo para estudiar", "intent": "GREETING", "topic": "social"},
    {"text": "hey hola", "intent": "GREETING", "topic": "social"},
    {"text": "que tal todo por aqui", "intent": "GREETING", "topic": "social"},
    {"text": "hola eduadapt ai", "intent": "GREETING", "topic": "social"},
    {"text": "hola de nuevo profe", "intent": "GREETING", "topic": "social"},
    {"text": "buenas tardes muchachos", "intent": "GREETING", "topic": "social"},
    {"text": "aloha bot", "intent": "GREETING", "topic": "social"},
    {"text": "holaaaaa", "intent": "GREETING", "topic": "social"},
    {"text": "hey que sopa", "intent": "GREETING", "topic": "social"},
    {"text": "buen dia profe un gusto saludarte", "intent": "GREETING", "topic": "social"},
    {"text": "hola robot", "intent": "GREETING", "topic": "social"},

    # --- NO ACADEMICOS: GOODBYE (Despedidas) ---
    {"text": "chao me voy a dormir", "intent": "GOODBYE", "topic": "social"},
    {"text": "adios profe gracias por la clase", "intent": "GOODBYE", "topic": "social"},
    {"text": "hasta luego nos vemos mañana", "intent": "GOODBYE", "topic": "social"},
    {"text": "ya termine por hoy chao bot", "intent": "GOODBYE", "topic": "social"},
    {"text": "bye bye cuidate", "intent": "GOODBYE", "topic": "social"},
    {"text": "me tengo que ir nos pillamos", "intent": "GOODBYE", "topic": "social"},
    {"text": "hablamos luego profe", "intent": "GOODBYE", "topic": "social"},
    {"text": "nos vemos en la siguiente sesion", "intent": "GOODBYE", "topic": "social"},
    {"text": "cerrar sesion adios", "intent": "GOODBYE", "topic": "social"},
    {"text": "listo chao", "intent": "GOODBYE", "topic": "social"},
    {"text": "me desconecto adios", "intent": "GOODBYE", "topic": "social"},
    {"text": "ya fue suficiente algebra por hoy bye", "intent": "GOODBYE", "topic": "social"},
    {"text": "bueno me retiro chao", "intent": "GOODBYE", "topic": "social"},
    {"text": "hasta la vista bot", "intent": "GOODBYE", "topic": "social"},
    {"text": "nos vemos", "intent": "GOODBYE", "topic": "social"},
    {"text": "chao pescao", "intent": "GOODBYE", "topic": "social"},
    {"text": "adios", "intent": "GOODBYE", "topic": "social"},
    {"text": "que pases buena noche chao", "intent": "GOODBYE", "topic": "social"},
    {"text": "voy a descansar hasta pronto", "intent": "GOODBYE", "topic": "social"},
    {"text": "bye tutor mil gracias", "intent": "GOODBYE", "topic": "social"},

    # --- NO ACADEMICOS: THANKS (Agradecimientos) ---
    {"text": "muchas gracias por la explicacion quedo super claro", "intent": "THANKS", "topic": "social"},
    {"text": "eres el mejor bot del mundo gracias", "intent": "THANKS", "topic": "social"},
    {"text": "gracias profe ya entendi el ejercicio", "intent": "THANKS", "topic": "social"},
    {"text": "perfecto mil gracias por tu paciencia", "intent": "THANKS", "topic": "social"},
    {"text": "te lo agradezco mucho me salvaste el parcial", "intent": "THANKS", "topic": "social"},
    {"text": "graciasssss", "intent": "THANKS", "topic": "social"},
    {"text": "excelente explicacion gracias", "intent": "THANKS", "topic": "social"},
    {"text": "me sirvio full tu ayuda ty", "intent": "THANKS", "topic": "social"},
    {"text": "entendidicimo gracias chatbot", "intent": "THANKS", "topic": "social"},
    {"text": "wow no lo habia visto asi muchas gracias", "intent": "THANKS", "topic": "social"},
    {"text": "gracias de verdad", "intent": "THANKS", "topic": "social"},
    {"text": "sos un crack gracias", "intent": "THANKS", "topic": "social"},
    {"text": "gracias por resolver mi duda tan rapido", "intent": "THANKS", "topic": "social"},
    {"text": "buenisimo gracias", "intent": "THANKS", "topic": "social"},
    {"text": "gracias por los ejercicios de practica", "intent": "THANKS", "topic": "social"},
    {"text": "me aclaraste todo el panorama te lo agradezco", "intent": "THANKS", "topic": "social"},
    {"text": "vales mil gracias bot", "intent": "THANKS", "topic": "social"},
    {"text": "asi da gusto aprender mates gracias", "intent": "THANKS", "topic": "social"},
    {"text": "gracias jefe", "intent": "THANKS", "topic": "social"},
    {"text": "muchas gracias profe", "intent": "THANKS", "topic": "social"},

    # --- NO ACADEMICOS: ABOUT (Acerca de / Funcionalidad) ---
    {"text": "quien eres tu?", "intent": "ABOUT", "topic": "social"},
    {"text": "cual es el objetivo de este chatbot?", "intent": "ABOUT", "topic": "social"},
    {"text": "que temas me puedes enseñar tu?", "intent": "ABOUT", "topic": "social"},
    {"text": "para que sirve eduadapt ai?", "intent": "ABOUT", "topic": "social"},
    {"text": "eres una inteligencia artificial de la uninorte?", "intent": "ABOUT", "topic": "social"},
    {"text": "me dices tus funciones principales porfa", "intent": "ABOUT", "topic": "social"},
    {"text": "quien te programo o te creo?", "intent": "ABOUT", "topic": "social"},
    {"text": "que puedes hacer ademas de resolver ecuaciones?", "intent": "ABOUT", "topic": "social"},
    {"text": "cual es tu proposito en esta plataforma?", "intent": "ABOUT", "topic": "social"},
    {"text": "eres un bot entrenado en algebra?", "intent": "ABOUT", "topic": "social"},
    {"text": "como funcionas por dentro?", "intent": "ABOUT", "topic": "social"},
    {"text": "de que trata este proyecto educativo?", "intent": "ABOUT", "topic": "social"},
    {"text": "me explicas que perfiles tienes configurados?", "intent": "ABOUT", "topic": "social"},
    {"text": "puedes tomarme examenes o solo das teoria?", "intent": "ABOUT", "topic": "social"},
    {"text": "cual es tu nombre real?", "intent": "ABOUT", "topic": "social"},
    {"text": "que modulos cubres en este sistema?", "intent": "ABOUT", "topic": "social"},
    {"text": "tu me ayudas a pasar algebra de primer semestre?", "intent": "ABOUT", "topic": "social"},
    {"text": "eres un agente inteligente tutor?", "intent": "ABOUT", "topic": "social"},
    {"text": "me dices que comandos o intenciones entiendes?", "intent": "ABOUT", "topic": "social"},
    {"text": "cual es el alcance de esta IA conversacional?", "intent": "ABOUT", "topic": "social"},

    # --- NO ACADEMICOS: CASUAL (Charla Casual / Off-topic) ---
    {"text": "cuantos años tienes chatbot?", "intent": "CASUAL", "topic": "social"},
    {"text": "te gusta el futbol o juegas algo?", "intent": "CASUAL", "topic": "social"},
    {"text": "cuanto es dos mas dos?", "intent": "CASUAL", "topic": "social"},
    {"text": "tienes sentimientos o eres frio?", "intent": "CASUAL", "topic": "social"},
    {"text": "hace un calor increible hoy en barranquilla xd", "intent": "CASUAL", "topic": "social"},
    {"text": "jajaja que buen chiste bot", "intent": "CASUAL", "topic": "social"},
    {"text": "que opinas del fin del mundo?", "intent": "CASUAL", "topic": "social"},
    {"text": "cuentame un chiste de matematicas para reirme", "intent": "CASUAL", "topic": "social"},
    {"text": "cual es tu comida favorita si fueras humano?", "intent": "CASUAL", "topic": "social"},
    {"text": "estoy muy aburrido hoy", "intent": "CASUAL", "topic": "social"},
    {"text": "viva el junior de barranquilla crack", "intent": "CASUAL", "topic": "social"},
    {"text": "tienes novia o novio robot?", "intent": "CASUAL", "topic": "social"},
    {"text": "que haces en tu tiempo libre cuando no estudias?", "intent": "CASUAL", "topic": "social"},
    {"text": "me recomiendas una pelicula de ciencia ficcion?", "intent": "CASUAL", "topic": "social"},
    {"text": "estoy cansado de tantas clases en la universidad", "intent": "CASUAL", "topic": "social"},
    {"text": "xd xd xd que locura", "intent": "CASUAL", "topic": "social"},
    {"text": "te consideras mas inteligente que chatgpt?", "intent": "CASUAL", "topic": "social"},
    {"text": "que musica te gusta escuchar en tu servidor?", "intent": "CASUAL", "topic": "social"},
    {"text": "tengo sueño en esta clase", "intent": "CASUAL", "topic": "social"},
    {"text": "eres real o estoy loco?", "intent": "CASUAL", "topic": "social"},

    # --- NO ACADEMICOS: UNKNOWN (Casos Fuera de Dominio o Ruido) ---
    {"text": "asdfghjklñ esto no significa nada", "intent": "UNKNOWN", "topic": "social"},
    {"text": "mañana tengo que comprar aguacates en el mercado", "intent": "UNKNOWN", "topic": "social"},
    {"text": "cuanto cuesta cambiarle el aceite a un carro chevrolet?", "intent": "UNKNOWN", "topic": "social"},
    {"text": "el teorema de la relatividad general de einstein es complejo", "intent": "UNKNOWN", "topic": "social"},
    {"text": "quien gano el mundial de futbol en 1998??", "intent": "UNKNOWN", "topic": "social"},
    {"text": "necesito una receta para hacer arroz con pollo colombiano", "intent": "UNKNOWN", "topic": "social"},
    {"text": "!!!!!!!!! ?????? @@@@@@@", "intent": "UNKNOWN", "topic": "social"},
    {"text": "la fotosintesis de las plantas convierte la luz solar en energia", "intent": "UNKNOWN", "topic": "social"},
    {"text": "como se cura una gripe comun rapido en casa?", "intent": "UNKNOWN", "topic": "social"},
    {"text": "el dolar subio de precio frente al peso hoy", "intent": "UNKNOWN", "topic": "social"},
    {"text": "qwertyuiopasdfghjklzxcvbnm", "intent": "UNKNOWN", "topic": "social"},
    {"text": "quien es el presidente actual de Francia?", "intent": "UNKNOWN", "topic": "social"},
    {"text": "me pasas el link para descargar minecraft gratis?", "intent": "UNKNOWN", "topic": "social"},
    {"text": "la mecanica cuantica analiza las particulas subatomicas", "intent": "UNKNOWN", "topic": "social"},
    {"text": "donde queda la ciudad de tokio exactamente?", "intent": "UNKNOWN", "topic": "social"},
    {"text": "letra de la cancion mas famosa de shakira", "intent": "UNKNOWN", "topic": "social"},
    {"text": "como se programa un videojuego en unity con c#?", "intent": "UNKNOWN", "topic": "social"},
    {"text": "el clima en europa durante el invierno es helado", "intent": "UNKNOWN", "topic": "social"},
    {"text": "ajshdkajshdkasjhdkajshd", "intent": "UNKNOWN", "topic": "social"},
    {"text": "que hora es en este momento en Sydney?", "intent": "UNKNOWN", "topic": "social"}
]

FRASES_AMBIGUAS = [("ayuda", "DOUBT"), ("no entiendo", "EXPLAIN"), ("explicame", "EXPLAIN"), ("quiz", "QUIZ"), ("ejercicios", "PRACTICE"), ("gracias", "THANKS"), ("bye", "GOODBYE"), ("hola", "GREETING")]

TYPO_RULES = {"que": ["q", "k", "ke"], "quiero": ["kiero", "qro"], "porque": ["xq", "porq"], "explicame": ["esplikame", "explicameee"], "hola": ["ola", "holaa", "holi"]}

# ----------------------------------------------------------------------
# FUNCIONES AUXILIARES
# ----------------------------------------------------------------------
def aplicar_typos(texto):
    palabras = texto.split()
    for i, palabra in enumerate(palabras):
        if random.random() < 0.12:  # antes 0.08
            for original, variantes in TYPO_RULES.items():
                if original in palabra.lower():
                    palabras[i] = palabra.lower().replace(original, random.choice(variantes))
    return " ".join(palabras)

def errores_teclado(texto):
    if random.random() > 0.0:
        return texto
    chars = list(texto)
    if len(chars) < 4:
        return texto
    idx = random.randint(1, len(chars)-2)
    chars[idx], chars[idx+1] = chars[idx+1], chars[idx]
    return "".join(chars)

def aplicar_ruido(texto):
    if random.random() < 0.20:
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
        # Añadir saludo/despedida secundario ocasionalmente
        if intent == "GREETING" and random.random() < 0.3:
            frase += " " + random.choice(["!", "!!", "😊", "👋", "como estas?", "todo bien?"])
        elif intent == "GOODBYE" and random.random() < 0.3:
            frase += " " + random.choice(["!", "!!", "👋", "cuidate", "nos vemos"])
        elif intent == "THANKS" and random.random() < 0.4:
            frase += " " + random.choice(["!", "!!", "🙏", "en serio", "de verdad"])
        elif intent == "CASUAL" and random.random() < 0.5:
            frase += " " + random.choice(["😭", "xd", "jaja", "...", "😴", "😩"])
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
    # Si el intent es social, con probabilidad 0.4 generar mixta (social + académico)
    if intent in ["GREETING", "GOODBYE", "THANKS", "CASUAL"] and random.random() < 0.4:
        return generar_frase_mixta(intent)
    # Si el intent es académico, con probabilidad 0.3 añadirle un toque social (prefijo o sufijo)
    elif intent in ["EXPLAIN", "PRACTICE", "DOUBT", "QUIZ", "ABOUT"] and random.random() < 0.3:
        # Elegir un social aleatorio para mezclar
        social = random.choice(["GREETING", "THANKS", "CASUAL"])
        return generar_frase_mixta(social)  # la función ya devuelve intent académico
    else:
        # Frase pura
        return generar_frase_pura(intent)

# ----------------------------------------------------------------------
# GENERAR DATASET COMPLETO
# ----------------------------------------------------------------------
def generar_dataset(textos_excluidos=None):
    dataset = []
    textos_existentes = set(textos_excluidos) if textos_excluidos else set()
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

def guardar_dataset(dataset_entrenamiento, dataset_real):
    """
    Guarda por separado el set de entrenamiento sintético y el set de prueba real (Holdout).
    """
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # 1. Guardar Dataset de Entrenamiento (Sintético)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset_entrenamiento, f, indent=2, ensure_ascii=False)
        
    # 2. Guardar Dataset de Prueba Real Ciego (Holdout)
    with open(TEST_REAL_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset_real, f, indent=2, ensure_ascii=False)
        
    print("\n=======================================================")
    print("✅ DATASETS NLP GUARDADOS EN FORMA INDEPENDIENTE (REC. A)")
    print("=======================================================")
    print(f"📦 Entrenamiento Sintético : {len(dataset_entrenamiento)} ejemplos -> {OUTPUT_PATH}")
    print(f"🎯 Set de Prueba Real Ciego: {len(dataset_real)} ejemplos -> {TEST_REAL_PATH}")
    print("-------------------------------------------------------")

if __name__ == "__main__":
    print("🚀 Iniciando generación estructurada de datos...")
    
    # 1. Cargamos las muestras manuales / reales que expandirás con tu grupo
    # Estructuramos la lista MENSAJES_REALES existente en tu archivo textos.py
    dataset_prueba_real = []
    for msg in MENSAJES_REALES:
        dataset_prueba_real.append({
            "id": str(uuid.uuid4()),
            "text": msg["text"],
            "intent": msg["intent"],
            "topic": msg["topic"],
            "timestamp": datetime.now().isoformat()
        })
    
    # Guardamos los textos reales en un conjunto para que el generador sintético 
    # NO repita por accidente estas mismas frases exactas en el set de entrenamiento
    textos_excluidos = set(msg["text"].lower().strip() for msg in MENSAJES_REALES)
    
    # 2. Generamos el dataset sintético masivo pasando el set de exclusión
    # (Asegura que tu función generar_dataset acepte o controle duplicados con esto)
    dataset_sintetico = generar_dataset(textos_excluidos)
    
    # 3. Guardamos ambos mundos en archivos separados
    guardar_dataset(dataset_sintetico, dataset_prueba_real)