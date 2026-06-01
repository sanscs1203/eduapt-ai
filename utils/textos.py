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
    {"text": "jajaja que buen chiste bot", "intent"