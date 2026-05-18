/* ============================================================
   EduAdapt AI – register.js
   Registro adaptativo con diagnóstico multitema
   y Matriz S de Estructura Pedagógica Avanzada
   ============================================================ */

import { registerWithEmail } from './auth.js';
import { CONFIG } from './config.js';

const regStep1 = document.getElementById('stepAccountForm');

if (regStep1) {

  /* ============================================================
     ESTADO GLOBAL DEL REGISTRO ADAPTATIVO
     ============================================================ */
  const regState = {
    fullname: '',
    password: '',
    email: '',
    preferences: [],
    
    // Autopercepciones por tema mapeado: { polinomios: 'low'|'mid'|'high', ... }
    topicSelfLevels: {},
    
    // Respuestas recolectadas del diagnóstico
    quizAnswers: []
  };

  const LEARNING_RATE = 0.08;

  // Lista ordenada de los 10 temas maestros del core académico
  const TOPICS_LIST = [
    "polinomios", "fracciones", "ecuaciones", "sistemas", "factorizacion", 
    "potencias", "radicales", "logaritmos", "funciones", "inecuaciones"
  ];

  /* ============================================================
     BANCO EXTENDIDO DE PREGUNTAS DIAGNÓSTICAS (Dificultad: 1-Fácil, 2-Medio, 3-Difícil)
     ============================================================ */
  const COMPREHENSIVE_BANK = [
    // ================================================
    // POLINOMIOS
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'polinomios', difficulty: 1, question: 'Simplifica el monomio: <code>3x + 5x - 2x</code>', options: ['6x', '7x', '5x', '8x'], correct: 0 },
    { topic: 'polinomios', difficulty: 1, question: '¿Cuál es el grado absoluto de <code>5x³y²</code>?', options: ['3', '2', '5', '6'], correct: 2 },
    { topic: 'polinomios', difficulty: 1, question: 'Suma los polinomios: <code>(2x + 3) + (4x - 1)</code>', options: ['6x + 2', '6x + 4', '2x + 2', '8x + 2'], correct: 0 },
    { topic: 'polinomios', difficulty: 1, question: '¿Cuál es el coeficiente principal de <code>7x⁴ - 2x³ + x - 5</code>?', options: ['-5', '7', '-2', '1'], correct: 1 },
    { topic: 'polinomios', difficulty: 1, question: 'Clasifica el polinomio <code>4x² - 3x + 1</code> según su número de términos:', options: ['Monomio', 'Binomio', 'Trinomio', 'Polinomio de 4 términos'], correct: 2 },
    { topic: 'polinomios', difficulty: 1, question: 'Evalúa <code>2x² - x + 3</code> para <code>x = 1</code>:', options: ['4', '5', '3', '6'], correct: 0 },
    { topic: 'polinomios', difficulty: 1, question: '¿Qué término es semejante a <code>3xy²</code>?', options: ['3x²y', '-5xy²', '2xy', 'y²'], correct: 1 },
    { topic: 'polinomios', difficulty: 1, question: 'Realiza la resta: <code>(5x - 2) - (3x + 1)</code>', options: ['2x - 3', '2x + 1', '8x - 1', '2x - 1'], correct: 0 },
    { topic: 'polinomios', difficulty: 1, question: 'El grado del polinomio <code>8x³y² + 5x⁴</code> es:', options: ['3', '4', '5', '6'], correct: 2 },
    { topic: 'polinomios', difficulty: 1, question: 'Multiplica: <code>2x * (x + 3)</code>', options: ['2x² + 6x', '2x² + 3x', '2x + 6', '3x² + 6x'], correct: 0 },

    // --- Medias (8) ---
    { topic: 'polinomios', difficulty: 2, question: 'Efectúa el producto notable: <code>(x + 2)(x + 3)</code>', options: ['x² + 5x + 6', 'x² + 6x + 5', 'x² + 6', 'x² + 5x + 5'], correct: 0 },
    { topic: 'polinomios', difficulty: 2, question: 'Desarrolla el binomio al cuadrado: <code>(x - 3)²</code>', options: ['x² - 9', 'x² - 6x - 9', 'x² - 6x + 9', 'x² + 9'], correct: 2 },
    { topic: 'polinomios', difficulty: 2, question: 'Multiplica: <code>(x + 4)(x - 4)</code>', options: ['x² + 16', 'x² - 16', 'x² - 8x + 16', 'x² + 8x - 16'], correct: 1 },
    { topic: 'polinomios', difficulty: 2, question: 'Simplifica: <code>(2x² + 3x - 1) - (x² - x + 2)</code>', options: ['x² + 4x - 3', 'x² + 2x + 1', 'x² + 4x + 1', '3x² + 2x - 3'], correct: 0 },
    { topic: 'polinomios', difficulty: 2, question: 'Factoriza el polinomio <code>x² - 5x + 6</code>', options: ['(x - 2)(x - 3)', '(x + 2)(x + 3)', '(x - 1)(x - 6)', '(x + 1)(x + 6)'], correct: 0 },
    { topic: 'polinomios', difficulty: 2, question: '¿Cuál es el valor de <code>k</code> si <code>(x + 2)(x + k) = x² + 7x + 10</code>?', options: ['2', '5', '7', '10'], correct: 1 },
    { topic: 'polinomios', difficulty: 2, question: 'Desarrolla: <code>(2x + 1)³</code>', options: ['8x³ + 12x² + 6x + 1', '8x³ + 6x² + 12x + 1', '6x³ + 12x² + 8x + 1', '8x³ + 4x² + 2x + 1'], correct: 0 },
    { topic: 'polinomios', difficulty: 2, question: 'Multiplica: <code>(x - 2)(x² + 2x + 4)</code>', options: ['x³ - 8', 'x³ + 8', 'x³ - 4x + 4', 'x³ - 4'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'polinomios', difficulty: 3, question: 'Si restamos <code>x² - 3x + 5</code> de <code>3x² - x + 2</code>, resulta:', options: ['2x² + 2x - 3', '2x² - 4x + 7', '-2x² - 2x + 3', '2x² + 2x + 7'], correct: 0 },
    { topic: 'polinomios', difficulty: 3, question: 'Halla el residuo al dividir <code>2x³ - 3x² + x - 5</code> entre <code>x - 2</code>:', options: ['-3', '1', '5', '-5'], correct: 2 },
    { topic: 'polinomios', difficulty: 3, question: 'Factoriza completamente: <code>x⁴ - 16</code>', options: ['(x² + 4)(x - 2)(x + 2)', '(x² - 4)(x² + 4)', '(x - 2)²(x + 2)²', '(x² + 4)(x - 4)'], correct: 0 },
    { topic: 'polinomios', difficulty: 3, question: 'Si <code>P(x) = x³ - 2x² + ax + b</code> es divisible por <code>x - 1</code> y por <code>x + 1</code>, entonces <code>a + b</code> es:', options: ['2', '-2', '0', '1'], correct: 0 },
    { topic: 'polinomios', difficulty: 3, question: 'Encuentra el término independiente en el desarrollo de <code>(x² + 1/x)⁶</code>', options: ['15', '20', '6', '1'], correct: 1 },

    // ================================================
    // FRACCIONES
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'fracciones', difficulty: 1, question: 'Simplifica la fracción: <code>(4x) / (2x²)</code>', options: ['2/x', '2x', 'x/2', '4/x'], correct: 0 },
    { topic: 'fracciones', difficulty: 1, question: 'Calcula: <code>a/3 + 2a/3</code>', options: ['3a/6', 'a', '3a/3', '2a/3'], correct: 1 },
    { topic: 'fracciones', difficulty: 1, question: 'Reduce: <code>6/8</code>', options: ['3/4', '2/3', '1/2', '4/5'], correct: 0 },
    { topic: 'fracciones', difficulty: 1, question: '¿Cuál es el recíproco de <code>5/x</code>?', options: ['-5/x', 'x/5', '5x', '1/(5x)'], correct: 1 },
    { topic: 'fracciones', difficulty: 1, question: 'Calcula: <code>(2/5) * (10/3)</code>', options: ['4/3', '20/15', '12/15', '5/3'], correct: 0 },
    { topic: 'fracciones', difficulty: 1, question: 'Suma: <code>1/2 + 1/4</code>', options: ['2/6', '3/4', '1/8', '2/4'], correct: 1 },
    { topic: 'fracciones', difficulty: 1, question: 'Simplifica: <code>(x²) / x</code> (x ≠ 0)', options: ['x', 'x²', '1/x', '0'], correct: 0 },
    { topic: 'fracciones', difficulty: 1, question: 'Multiplica: <code>3 * (x/6)</code>', options: ['x/2', 'x/3', '2x', '3x/6'], correct: 0 },
    { topic: 'fracciones', difficulty: 1, question: 'Divide: <code>(x/2) / (x/4)</code>', options: ['2', '1/2', 'x/2', '4'], correct: 0 },
    { topic: 'fracciones', difficulty: 1, question: '¿Cuál es el mínimo común denominador de <code>1/x</code> y <code>1/(2x)</code>?', options: ['x', '2x', 'x²', '3x'], correct: 1 },

    // --- Medias (8) ---
    { topic: 'fracciones', difficulty: 2, question: 'Suma las fracciones algebraicas: <code>1/x + 1/(2x)</code>', options: ['2/(3x)', '3/(2x)', '1/(3x)', '2/x'], correct: 1 },
    { topic: 'fracciones', difficulty: 2, question: 'Multiplica: <code>(x/3) * (6/x²)</code>', options: ['2/x', 'x/2', '2x', '18/x'], correct: 0 },
    { topic: 'fracciones', difficulty: 2, question: 'Simplifica: <code>(x² - 4) / (x + 2)</code>', options: ['x + 2', 'x - 2', 'x', 'x² - 2'], correct: 1 },
    { topic: 'fracciones', difficulty: 2, question: 'Efectúa: <code>(2/(x-1)) - (1/(x+1))</code>', options: ['(x+3)/(x²-1)', '(x+3)/((x-1)(x+1))', '1/(x²-1)', '(x-3)/(x²-1)'], correct: 1 },
    { topic: 'fracciones', difficulty: 2, question: 'Resuelve: <code>1/x + 1/3 = 2/x</code>', options: ['x = 3', 'x = 1', 'x = 6', 'x = -3'], correct: 0 },
    { topic: 'fracciones', difficulty: 2, question: 'Simplifica la fracción compleja: <code>(1/x) / (1/x²)</code>', options: ['x', '1/x', 'x²', '1'], correct: 0 },
    { topic: 'fracciones', difficulty: 2, question: 'Calcula: <code>(x/(x+1)) + (1/(x+1))</code>', options: ['(x+1)/(x+1)', 'x/(x+1)', '1', '(2x+1)/(x+1)'], correct: 2 },
    { topic: 'fracciones', difficulty: 2, question: 'Simplifica: <code>(3x²y)/(6xy²)</code>', options: ['x/(2y)', 'y/(2x)', 'x/2', '1/2'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'fracciones', difficulty: 3, question: 'Simplifica completamente: <code>(x² - 1) / (x + 1)</code>', options: ['x + 1', 'x - 1', 'x', '1'], correct: 1 },
    { topic: 'fracciones', difficulty: 3, question: 'Descompón en fracciones parciales: <code>(3x + 5) / (x² - 1)</code>', options: ['1/(x-1) + 2/(x+1)', '4/(x-1) - 1/(x+1)', '2/(x-1) + 1/(x+1)', '3/(x-1) + 2/(x+1)'], correct: 2 },
    { topic: 'fracciones', difficulty: 3, question: 'Simplifica: <code>(x³ - 8) / (x² - 4)</code>', options: ['x + 2', '(x² + 2x + 4)/(x + 2)', 'x - 2', '(x² - 2x + 4)/(x - 2)'], correct: 1 },
    { topic: 'fracciones', difficulty: 3, question: 'Resuelve: <code>2/(x-1) + 1/(x+1) = 5/(x²-1)</code>', options: ['x = 2', 'x = 3', 'x = 0', 'x = -1'], correct: 1 },
    { topic: 'fracciones', difficulty: 3, question: 'Encuentra el valor de <code>A</code> y <code>B</code> si <code>(5x + 1)/(x² - x - 2) = A/(x-2) + B/(x+1)</code>', options: ['A=3, B=2', 'A=11/3, B=4/3', 'A=4, B=1', 'A=2, B=3'], correct: 0 },

    // ================================================
    // ECUACIONES
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'ecuaciones', difficulty: 1, question: 'Resuelve para x: <code>2x + 6 = 14</code>', options: ['x = 2', 'x = 4', 'x = 6', 'x = 10'], correct: 1 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Despeja x en: <code>x - 5 = -2</code>', options: ['x = -7', 'x = 3', 'x = -3', 'x = 5'], correct: 1 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Resuelve: <code>3x = 12</code>', options: ['x = 2', 'x = 3', 'x = 4', 'x = 6'], correct: 2 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Despeja: <code>x/4 = 5</code>', options: ['x = 9', 'x = 1', 'x = 20', 'x = 5/4'], correct: 2 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Resuelve: <code>7 + x = 10</code>', options: ['x = 3', 'x = 17', 'x = -3', 'x = 0'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Si <code>5x - 3 = 2</code>, entonces x vale:', options: ['1', '2', '3', '5'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Resuelve: <code>4x + 3 = 3x + 8</code>', options: ['x = 5', 'x = 11', 'x = 1', 'x = -5'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Encuentra x: <code>2(x + 1) = 8</code>', options: ['x = 3', 'x = 4', 'x = 6', 'x = 2'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 1, question: 'La solución de <code>10 - x = 4</code> es:', options: ['x = 6', 'x = 14', 'x = -6', 'x = 4'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 1, question: 'Resuelve: <code>9 = 3x - 3</code>', options: ['x = 2', 'x = 4', 'x = 3', 'x = 12'], correct: 1 },

    // --- Medias (8) ---
    { topic: 'ecuaciones', difficulty: 2, question: 'Encuentra la raíz de: <code>3(x - 2) = 12</code>', options: ['x = 4', 'x = 6', 'x = 8', 'x = 2'], correct: 1 },
    { topic: 'ecuaciones', difficulty: 2, question: '¿Cuáles son las soluciones de <code>x² - 9 = 0</code>?', options: ['x = 3', 'x = -3', 'x = ±3', 'No tiene solución'], correct: 2 },
    { topic: 'ecuaciones', difficulty: 2, question: 'Resuelve: <code>2x - 3 = 5x + 6</code>', options: ['x = -3', 'x = 3', 'x = 1', 'x = -1'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 2, question: 'La ecuación <code>2x² - 8 = 0</code> tiene soluciones:', options: ['x = 2', 'x = -2', 'x = ±2', 'x = 4'], correct: 2 },
    { topic: 'ecuaciones', difficulty: 2, question: 'Resuelve: <code>(x - 1)/2 = 3</code>', options: ['x = 7', 'x = 5', 'x = 4', 'x = 6'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 2, question: 'Despeja x en: <code>ax + b = c</code> (a ≠ 0)', options: ['x = (c - b)/a', 'x = (c + b)/a', 'x = a/(c - b)', 'x = c/a - b'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 2, question: 'Resuelve: <code>4x² = 36</code>', options: ['x = 6', 'x = 9', 'x = ±3', 'x = ±6'], correct: 2 },
    { topic: 'ecuaciones', difficulty: 2, question: 'Si <code>3(2x - 4) = 6(x - 2)</code>, la ecuación es:', options: ['Consistente', 'Inconsistente', 'Identidad', 'Indeterminada'], correct: 2 },

    // --- Difíciles (5) ---
    { topic: 'ecuaciones', difficulty: 3, question: 'Resuelve la ecuación con valor absoluto: <code>|x - 3| = 5</code>', options: ['x = 8', 'x = 8 y x = -2', 'x = -2', 'x = 2 y x = -8'], correct: 1 },
    { topic: 'ecuaciones', difficulty: 3, question: 'Resuelve: <code>x³ - 4x = 0</code>', options: ['x = 0, x = 2', 'x = 0, x = ±2', 'x = 2, x = -2', 'x = 0, x = 4'], correct: 1 },
    { topic: 'ecuaciones', difficulty: 3, question: 'Encuentra las raíces de <code>2x² - 5x - 3 = 0</code>', options: ['x = 3, x = -1/2', 'x = -3, x = 1/2', 'x = 3/2, x = -1', 'x = 1, x = -3/2'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 3, question: 'Resuelve la ecuación racional: <code>1/x + 1/(x+1) = 1/2</code>', options: ['x = 1', 'x = 2', 'x = -2', 'x = 3'], correct: 0 },
    { topic: 'ecuaciones', difficulty: 3, question: '¿Cuántas soluciones reales tiene <code>x⁴ - 5x² + 4 = 0</code>?', options: ['1', '2', '3', '4'], correct: 3 },

    // ================================================
    // SISTEMAS
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'sistemas', difficulty: 1, question: 'En un sistema, si <code>x = 2</code> e <code>y = 3</code>, ¿cuánto es <code>x + y</code>?', options: ['1', '5', '6', '0'], correct: 1 },
    { topic: 'sistemas', difficulty: 1, question: 'Si <code>x + y = 4</code> y <code>x = y</code>, el valor de x es:', options: ['1', '2', '3', '4'], correct: 1 },
    { topic: 'sistemas', difficulty: 1, question: 'Resuelve: <code>x + y = 5</code>, <code>x - y = 1</code>', options: ['x=3, y=2', 'x=2, y=3', 'x=4, y=1', 'x=1, y=4'], correct: 0 },
    { topic: 'sistemas', difficulty: 1, question: 'Si <code>2x + y = 7</code> y <code>x = 1</code>, entonces y es:', options: ['2', '3', '5', '4'], correct: 2 },
    { topic: 'sistemas', difficulty: 1, question: 'Resuelve: <code>y = 2x</code>, <code>x + y = 6</code>', options: ['x=2, y=4', 'x=1, y=2', 'x=3, y=6', 'x=4, y=8'], correct: 0 },
    { topic: 'sistemas', difficulty: 1, question: 'Si <code>x + 2y = 5</code> y <code>x = 3</code>, entonces y es:', options: ['1', '2', '3', '4'], correct: 0 },
    { topic: 'sistemas', difficulty: 1, question: '¿Cuál es el punto de intersección de <code>y = x</code> e <code>y = 2</code>?', options: ['(2,2)', '(2,1)', '(1,2)', '(0,2)'], correct: 0 },
    { topic: 'sistemas', difficulty: 1, question: 'Resuelve: <code>3x = 9</code>, <code>2y = 6</code>', options: ['x=3, y=3', 'x=3, y=2', 'x=6, y=3', 'x=9, y=6'], correct: 0 },
    { topic: 'sistemas', difficulty: 1, question: 'Si <code>x + y = 10</code> y <code>x = 7</code>, entonces y = ?', options: ['3', '4', '5', '17'], correct: 0 },
    { topic: 'sistemas', difficulty: 1, question: 'En el sistema <code>y = 3x</code> y <code>x + y = 8</code>, el valor de x es:', options: ['1', '2', '3', '4'], correct: 1 },

    // --- Medias (8) ---
    { topic: 'sistemas', difficulty: 2, question: 'Resuelve el sistema lineal: <code>x + y = 5; x - y = 1</code>', options: ['x=2, y=3', 'x=3, y=2', 'x=4, y=1', 'x=1, y=4'], correct: 1 },
    { topic: 'sistemas', difficulty: 2, question: 'Por método de sustitución, si <code>y = 2x</code> y <code>x + y = 9</code>, entonces:', options: ['x=3, y=6', 'x=6, y=3', 'x=4, y=5', 'x=2, y=7'], correct: 0 },
    { topic: 'sistemas', difficulty: 2, question: 'Resuelve: <code>2x + 3y = 8</code> y <code>x - y = 1</code>', options: ['x=2, y=1', 'x=1, y=0', 'x=3, y=2/3', 'x=2, y=1/3'], correct: 0 },
    { topic: 'sistemas', difficulty: 2, question: '¿Cuántas soluciones tiene el sistema <code>2x + y = 4</code>, <code>4x + 2y = 8</code>?', options: ['Una', 'Ninguna', 'Infinitas', 'Dos'], correct: 2 },
    { topic: 'sistemas', difficulty: 2, question: 'Resuelve por igualación: <code>y = x + 2</code>, <code>y = 2x - 1</code>', options: ['x=3, y=5', 'x=2, y=4', 'x=1, y=3', 'x=4, y=6'], correct: 0 },
    { topic: 'sistemas', difficulty: 2, question: 'El sistema <code>x + y = 3</code> y <code>2x + 2y = 5</code> es:', options: ['Consistente', 'Inconsistente', 'Dependiente', 'Indeterminado'], correct: 1 },
    { topic: 'sistemas', difficulty: 2, question: 'Resuelve: <code>3x - y = 7</code>, <code>2x + y = 8</code>', options: ['x=3, y=2', 'x=2, y= -1', 'x=1, y= -4', 'x=4, y=5'], correct: 0 },
    { topic: 'sistemas', difficulty: 2, question: 'Si <code>ax + by = c</code> y <code>dx + ey = f</code>, ¿cuándo no tiene solución?', options: ['a/d = b/e = c/f', 'a/d = b/e ≠ c/f', 'a/d ≠ b/e', 'a=b y c=d'], correct: 1 },

    // --- Difíciles (5) ---
    { topic: 'sistemas', difficulty: 3, question: 'Determina el punto de intersección de: <code>2x - y = 4; x + y = 5</code>', options: ['(3, 2)', '(2, 3)', '(1, 4)', '(4, 1)'], correct: 0 },
    { topic: 'sistemas', difficulty: 3, question: 'Resuelve el sistema no lineal: <code>y = x²</code> y <code>y = 2x + 3</code>', options: ['x=3, y=9; x=-1, y=1', 'x=1, y=1; x=-3, y=9', 'x=2, y=4; x=-1, y=1', 'x=0, y=0; x=3, y=9'], correct: 0 },
    { topic: 'sistemas', difficulty: 3, question: 'Halla el valor de <code>k</code> para que el sistema <code>2x + ky = 5</code>, <code>3x + 6y = 15</code> tenga infinitas soluciones.', options: ['k = 2', 'k = 4', 'k = 3', 'k = 1'], correct: 1 },
    { topic: 'sistemas', difficulty: 3, question: 'Un sistema de dos ecuaciones lineales tiene solución única si:', options: ['Las rectas son paralelas', 'Las rectas coinciden', 'Las rectas se cortan en un punto', 'Las rectas son perpendiculares'], correct: 2 },
    { topic: 'sistemas', difficulty: 3, question: 'Resuelve usando determinantes (Cramer): <code>4x - y = 7</code>, <code>2x + 3y = 7</code>', options: ['x=2, y=1', 'x=1, y=3', 'x=3, y=5', 'x=2, y=-1'], correct: 0 },

    // ================================================
    // FACTORIZACION
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'factorizacion', difficulty: 1, question: 'Extrae el factor común de: <code>2x² + 4x</code>', options: ['2(x² + 2)', 'x(2x + 4)', '2x(x + 2)', '4x(x + 1)'], correct: 2 },
    { topic: 'factorizacion', difficulty: 1, question: '¿Cuál es el factor común en <code>ab + ac</code>?', options: ['a', 'b', 'c', 'bc'], correct: 0 },
    { topic: 'factorizacion', difficulty: 1, question: 'Factoriza: <code>3x + 6</code>', options: ['3(x + 6)', '3(x + 2)', 'x(3 + 6)', '6(x + 1)'], correct: 1 },
    { topic: 'factorizacion', difficulty: 1, question: 'La expresión <code>x² - 4</code> es una:', options: ['Suma de cuadrados', 'Diferencia de cuadrados', 'Trinomio cuadrado perfecto', 'Binomio al cubo'], correct: 1 },
    { topic: 'factorizacion', difficulty: 1, question: 'Factoriza: <code>x² + 2x</code>', options: ['x(x + 2)', '2x(x + 1)', 'x²(1 + 2/x)', '(x + 1)(x + 1)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 1, question: 'El factor común de <code>4x²y - 8xy²</code> es:', options: ['2xy', '4xy', '2x²y²', '8xy'], correct: 1 },
    { topic: 'factorizacion', difficulty: 1, question: 'Factoriza: <code>5a - 5b</code>', options: ['5(a - b)', 'a(5 - b)', '5a(1 - b/a)', '5(a + b)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 1, question: 'Reconoce: <code>x² + 2x + 1</code> es:', options: ['(x + 1)²', '(x - 1)²', '(x + 2)²', '(x + 1)(x - 1)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 1, question: 'Factoriza: <code>x² - 25</code>', options: ['(x - 5)²', '(x + 5)(x - 5)', '(x - 25)(x + 1)', 'No factorizable'], correct: 1 },
    { topic: 'factorizacion', difficulty: 1, question: 'Saca factor común: <code>7m² + 14m</code>', options: ['7m(m + 2)', 'm(7m + 14)', '7(m² + 2m)', '14m(m/2 + 1)'], correct: 0 },

    // --- Medias (8) ---
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza la diferencia de cuadrados: <code>x² - 16</code>', options: ['(x-4)²', '(x+4)(x-4)', '(x-16)(x+1)', 'Irreducible'], correct: 1 },
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza el trinomio: <code>x² + 5x + 6</code>', options: ['(x+5)(x+1)', '(x+2)(x+3)', '(x+6)(x-1)', '(x-2)(x-3)'], correct: 1 },
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza: <code>2x² + 7x + 3</code>', options: ['(2x+1)(x+3)', '(2x+3)(x+1)', '(x+1)(2x+3)', '(2x+1)(x+6)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 2, question: 'Completa el trinomio cuadrado perfecto: <code>x² - 10x + ?</code>', options: ['25', '100', '5', '10'], correct: 0 },
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza: <code>4x² - 12x + 9</code>', options: ['(2x - 3)²', '(4x - 9)(x - 1)', '(2x + 3)(2x - 3)', 'No factorizable'], correct: 0 },
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza: <code>x³ - x</code>', options: ['x(x - 1)²', 'x(x + 1)(x - 1)', 'x(x² - 1)', '(x - 1)(x² + x)'], correct: 1 },
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza por agrupación: <code>ax + ay + bx + by</code>', options: ['(a+b)(x+y)', '(a+x)(b+y)', '(ab)(xy)', '(a-b)(x-y)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 2, question: 'Factoriza: <code>x² - 7x + 10</code>', options: ['(x - 5)(x - 2)', '(x - 10)(x + 1)', '(x + 5)(x + 2)', '(x - 3)(x - 4)'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'factorizacion', difficulty: 3, question: 'Factoriza por agrupación de términos: <code>ax + ay + bx + by</code>', options: ['(a+b)(x+y)', '(a+x)(b+y)', '(ab)(xy)', '(a-b)(x-y)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 3, question: 'Factoriza completamente: <code>x⁴ - 1</code>', options: ['(x² + 1)(x - 1)(x + 1)', '(x - 1)²(x + 1)²', '(x² - 1)(x² + 1)', 'x(x³ - 1)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 3, question: 'Factoriza: <code>6x² - x - 2</code>', options: ['(3x + 2)(2x - 1)', '(2x + 1)(3x - 2)', '(6x + 1)(x - 2)', '(3x - 2)(2x + 1)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 3, question: 'Factoriza el polinomio: <code>x³ + 27</code>', options: ['(x + 3)(x² - 3x + 9)', '(x - 3)(x² + 3x + 9)', '(x + 3)³', '(x + 3)(x² + 9)'], correct: 0 },
    { topic: 'factorizacion', difficulty: 3, question: 'Factoriza: <code>2x³ - 3x² - 8x + 12</code>', options: ['(x - 2)(2x² + x - 6)', '(x + 2)(2x² - 7x + 6)', '(x - 2)(x + 2)(2x - 3)', '(x - 2)(2x - 3)(x + 2)'], correct: 2 },

    // ================================================
    // POTENCIAS
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'potencias', difficulty: 1, question: 'Simplifica usando leyes de exponentes: <code>x³ * x²</code>', options: ['x⁶', 'x⁵', 'x¹', '2x⁵'], correct: 1 },
    { topic: 'potencias', difficulty: 1, question: '¿A qué es igual cualquier base no nula elevada a la potencia cero (<code>x⁰</code>)?', options: ['0', 'x', '1', 'No definido'], correct: 2 },
    { topic: 'potencias', difficulty: 1, question: 'Reduce: <code>y⁷ / y⁴</code>', options: ['y³', 'y¹¹', 'y²⁸', '1/y³'], correct: 0 },
    { topic: 'potencias', difficulty: 1, question: '¿Cuánto es <code>2³</code>?', options: ['6', '8', '9', '16'], correct: 1 },
    { topic: 'potencias', difficulty: 1, question: 'Simplifica: <code>(a²)³</code>', options: ['a⁵', 'a⁶', 'a⁸', 'a²³'], correct: 1 },
    { topic: 'potencias', difficulty: 1, question: 'Evalúa: <code>(-2)²</code>', options: ['-4', '4', '-2', '2'], correct: 1 },
    { topic: 'potencias', difficulty: 1, question: '¿Cuál es la expresión equivalente a <code>1/x²</code>?', options: ['x⁻²', 'x²', '2/x', '-x²'], correct: 0 },
    { topic: 'potencias', difficulty: 1, question: 'Multiplica: <code>10² * 10³</code>', options: ['10⁵', '10⁶', '20⁵', '100'], correct: 0 },
    { topic: 'potencias', difficulty: 1, question: 'Simplifica: <code>x¹ * x⁰</code>', options: ['x', '0', '1', 'x²'], correct: 0 },
    { topic: 'potencias', difficulty: 1, question: '¿Cuál es la base de <code>3⁴ = 81</code>?', options: ['3', '4', '81', '12'], correct: 0 },

    // --- Medias (8) ---
    { topic: 'potencias', difficulty: 2, question: 'Simplifica la expresión de potencia: <code>(2x³y²)²</code>', options: ['4x⁶y⁴', '2x⁶y⁴', '4x⁵y⁴', '4x⁶y²'], correct: 0 },
    { topic: 'potencias', difficulty: 2, question: 'Reduce la fracción: <code>x⁵ / x³</code>', options: ['x⁸', 'x²', 'x¹⁵', '1/x²'], correct: 1 },
    { topic: 'potencias', difficulty: 2, question: 'Simplifica: <code>(a⁻² * a⁵) / a</code>', options: ['a²', 'a³', 'a⁴', 'a¹'], correct: 0 },
    { topic: 'potencias', difficulty: 2, question: 'Evalúa: <code>(3²)³</code>', options: ['3⁵', '3⁶', '3⁹', '3⁸'], correct: 1 },
    { topic: 'potencias', difficulty: 2, question: 'Simplifica: <code>(x²y)³ / (xy²)</code>', options: ['x⁵y', 'x⁷/y⁵', 'x⁵/y', 'x⁴y'], correct: 2 },
    { topic: 'potencias', difficulty: 2, question: 'Expresa con exponente positivo: <code>5x⁻³</code>', options: ['5/x³', '5x³', '1/(5x³)', '-5x³'], correct: 0 },
    { topic: 'potencias', difficulty: 2, question: 'Simplifica: <code>(2x⁻¹)² * x³</code>', options: ['4x', '4/x', '4x⁵', '2x'], correct: 0 },
    { topic: 'potencias', difficulty: 2, question: '¿Cuál es el valor de <code>4¹/²</code>?', options: ['2', '1/2', '1', '8'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'potencias', difficulty: 3, question: '¿Cuál es el valor equivalente de <code>(x⁻² * x⁵)³</code>?', options: ['x⁹', 'x⁻³', 'x⁷', 'x⁶'], correct: 0 },
    { topic: 'potencias', difficulty: 3, question: 'Simplifica: <code>(a²b⁻¹)³ / (a⁻¹b²)</code>', options: ['a⁷/b⁵', 'a⁷b⁵', 'a⁵/b⁷', 'a/b'], correct: 0 },
    { topic: 'potencias', difficulty: 3, question: 'Resuelve la ecuación exponencial: <code>2ˣ = 32</code>', options: ['x = 5', 'x = 16', 'x = 6', 'x = 4'], correct: 0 },
    { topic: 'potencias', difficulty: 3, question: 'Simplifica: <code>(27^(2/3))</code>', options: ['9', '18', '6', '3'], correct: 0 },
    { topic: 'potencias', difficulty: 3, question: 'Si <code>3ˣ⁺² = 81</code>, entonces x es:', options: ['2', '3', '4', '1'], correct: 0 },

    // ================================================
    // RADICALES
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'radicales', difficulty: 1, question: 'Calcula la raíz cuadrada exacta: <code>√64</code>', options: ['6', '7', '8', '9'], correct: 2 },
    { topic: 'radicales', difficulty: 1, question: '¿A qué exponente equivale la raíz cuadrada (<code>√x</code>)?', options: ['x²', 'x¹', 'x^(1/2)', 'x^(-1)'], correct: 2 },
    { topic: 'radicales', difficulty: 1, question: 'Calcula: <code>√25</code>', options: ['5', '-5', '±5', '2.5'], correct: 0 },
    { topic: 'radicales', difficulty: 1, question: 'Simplifica: <code>√(x²)</code> (x ≥ 0)', options: ['x', '|x|', 'x²', '2x'], correct: 0 },
    { topic: 'radicales', difficulty: 1, question: '¿Cuál es el valor de <code>∛8</code>?', options: ['2', '4', '8', '2.828'], correct: 0 },
    { topic: 'radicales', difficulty: 1, question: 'Multiplica: <code>√2 * √8</code>', options: ['√10', '4', '√16', '2'], correct: 1 },
    { topic: 'radicales', difficulty: 1, question: '¿Cuánto es <code>√0</code>?', options: ['0', '1', 'No definido', 'Infinito'], correct: 0 },
    { topic: 'radicales', difficulty: 1, question: 'Simplifica: <code>√(4x²)</code>', options: ['2x', '4x', '2x²', '|2x|'], correct: 3 },
    { topic: 'radicales', difficulty: 1, question: '¿Cuál es el índice en <code>∛27</code>?', options: ['2', '3', '27', '1/3'], correct: 1 },
    { topic: 'radicales', difficulty: 1, question: 'Expresa como radical: <code>x^(1/3)</code>', options: ['√x', '∛x', 'x³', '1/√x'], correct: 1 },

    // --- Medias (8) ---
    { topic: 'radicales', difficulty: 2, question: 'Simplifica el radical compuesto: <code>√18</code>', options: ['9√2', '3√2', '2√3', '4√2'], correct: 1 },
    { topic: 'radicales', difficulty: 2, question: 'Efectúa la operación: <code>2√5 + 4√5</code>', options: ['6√10', '6√5', '8√5', '2√5'], correct: 1 },
    { topic: 'radicales', difficulty: 2, question: 'Simplifica: <code>√50 - √18</code>', options: ['2√2', '4√2', '√32', '√2'], correct: 1 },
    { topic: 'radicales', difficulty: 2, question: 'Multiplica: <code>(√3 + 1)(√3 - 1)</code>', options: ['2', '3', '2√3', '1'], correct: 0 },
    { topic: 'radicales', difficulty: 2, question: 'Simplifica: <code>√(x³)</code> (x ≥ 0)', options: ['x√x', 'x²', 'x³', '√x'], correct: 0 },
    { topic: 'radicales', difficulty: 2, question: 'Racionaliza: <code>5 / √5</code>', options: ['√5', '5√5', '1', '25√5'], correct: 0 },
    { topic: 'radicales', difficulty: 2, question: 'Simplifica: <code>∛(8x⁶y³)</code>', options: ['2x²y', '2x³y', '8x²y', '2x²|y|'], correct: 0 },
    { topic: 'radicales', difficulty: 2, question: 'Resuelve: <code>√x = 4</code>', options: ['x = 16', 'x = 2', 'x = 4', 'x = 8'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'radicales', difficulty: 3, question: 'Racionaliza la expresión: <code>1 / √3</code>', options: ['√3', '3', '(√3) / 3', '1/3'], correct: 2 },
    { topic: 'radicales', difficulty: 3, question: 'Simplifica: <code>√(4 + 2√3)</code>', options: ['√3 + 1', '√3 - 1', '2 + √3', '√3 + 2'], correct: 0 },
    { topic: 'radicales', difficulty: 3, question: 'Resuelve: <code>√(x+3) = x - 3</code>', options: ['x = 6', 'x = 1', 'x = 6, x = 1', 'x = 9'], correct: 2 },
    { topic: 'radicales', difficulty: 3, question: 'Racionaliza el denominador: <code>2 / (√5 - 1)</code>', options: ['(√5 + 1)/2', '(√5 - 1)/2', '2(√5 + 1)', '(√5 + 1)'], correct: 0 },
    { topic: 'radicales', difficulty: 3, question: 'Simplifica: <code>∛(54) - ∛(2)</code>', options: ['2∛2', '3∛2', '∛52', '2∛6'], correct: 1 },

    // ================================================
    // LOGARITMOS
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'logaritmos', difficulty: 1, question: 'Por definición de logaritmo, si <code>log₁₀(100) = 2</code>, la base es:', options: ['2', '10', '100', 'e'], correct: 1 },
    { topic: 'logaritmos', difficulty: 1, question: '¿Cuánto vale el logaritmo de 1 en cualquier base válida (<code>log_b(1)</code>)?', options: ['1', 'b', '0', 'Infinito'], correct: 2 },
    { topic: 'logaritmos', difficulty: 1, question: 'Calcula: <code>log₂(8)</code>', options: ['2', '3', '4', '16'], correct: 1 },
    { topic: 'logaritmos', difficulty: 1, question: '¿A qué es igual <code>log_a(a)</code> (a>0, a≠1)?', options: ['0', '1', 'a', 'a²'], correct: 1 },
    { topic: 'logaritmos', difficulty: 1, question: 'Expresa en forma logarítmica: <code>5² = 25</code>', options: ['log₂(25)=5', 'log₅(2)=25', 'log₅(25)=2', 'log₂(5)=25'], correct: 2 },
    { topic: 'logaritmos', difficulty: 1, question: 'Calcula: <code>log₁₀(1000)</code>', options: ['1', '2', '3', '10'], correct: 2 },
    { topic: 'logaritmos', difficulty: 1, question: 'El logaritmo natural usa base:', options: ['10', '2', 'e', 'π'], correct: 2 },
    { topic: 'logaritmos', difficulty: 1, question: 'Calcula: <code>log₃(1/3)</code>', options: ['-1', '1', '3', '-3'], correct: 0 },
    { topic: 'logaritmos', difficulty: 1, question: 'Simplifica: <code>log_b(b²)</code>', options: ['2', 'b', 'b²', '1'], correct: 0 },
    { topic: 'logaritmos', difficulty: 1, question: '¿Cuál es el valor de <code>log(0.1)</code> en base 10?', options: ['-1', '0', '1', '10'], correct: 0 },

    // --- Medias (8) ---
    { topic: 'logaritmos', difficulty: 2, question: '¿Qué valor de x satisface la igualdad: <code>log₂(x) = 3</code>?', options: ['x = 6', 'x = 8', 'x = 9', 'x = 5'], correct: 1 },
    { topic: 'logaritmos', difficulty: 2, question: 'Aplica propiedades: <code>log(A) + log(B)</code> es equivalente a:', options: ['log(A + B)', 'log(A * B)', 'log(A / B)', 'log(A) * log(B)'], correct: 1 },
    { topic: 'logaritmos', difficulty: 2, question: 'Simplifica: <code>log₃(9) + log₃(3)</code>', options: ['log₃(12)', '3', 'log₃(27)', '2'], correct: 1 },
    { topic: 'logaritmos', difficulty: 2, question: 'Expande: <code>log(x²y)</code>', options: ['2log(x) + log(y)', 'log(x) + log(y)', '2log(x)y', 'log(x²)log(y)'], correct: 0 },
    { topic: 'logaritmos', difficulty: 2, question: 'Resuelve: <code>log(x) = 1</code> (base 10)', options: ['x = 1', 'x = 10', 'x = 0', 'x = e'], correct: 1 },
    { topic: 'logaritmos', difficulty: 2, question: 'Calcula: <code>log₄(64)</code>', options: ['3', '4', '2', '8'], correct: 0 },
    { topic: 'logaritmos', difficulty: 2, question: 'Simplifica: <code>log₅(125) - log₅(5)</code>', options: ['log₅(120)', '2', '3', '1'], correct: 1 },
    { topic: 'logaritmos', difficulty: 2, question: 'Convierte a base 10: <code>log₂(5)</code> usando cambio de base:', options: ['log(5)/log(2)', 'log(2)/log(5)', 'log(10)/log(2)', 'log(5) - log(2)'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'logaritmos', difficulty: 3, question: 'Resuelve la ecuación logarítmica elemental: <code>ln(e^x) = 5</code>', options: ['x = 5', 'x = e⁵', 'x = 1', 'x = ln(5)'], correct: 0 },
    { topic: 'logaritmos', difficulty: 3, question: 'Resuelve: <code>log₂(x) + log₂(x - 2) = 3</code>', options: ['x = 4', 'x = 3', 'x = 2', 'x = 5'], correct: 0 },
    { topic: 'logaritmos', difficulty: 3, question: 'Si <code>logₐ(2) = 0.3</code> y <code>logₐ(3) = 0.48</code>, calcula <code>logₐ(12)</code>', options: ['1.08', '0.78', '0.9', '1.2'], correct: 0 },
    { topic: 'logaritmos', difficulty: 3, question: 'Expresa como un solo logaritmo: <code>3log(x) - 2log(y) + log(z)</code>', options: ['log(x³z/y²)', 'log(x³y²z)', 'log((xz)³/y²)', 'log(x³z) - log(y²)'], correct: 0 },
    { topic: 'logaritmos', difficulty: 3, question: 'Resuelve: <code>log(x²) = 2</code> (base 10)', options: ['x = 10', 'x = ±10', 'x = 100', 'x = 5'], correct: 1 },

    // ================================================
    // FUNCIONES
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'funciones', difficulty: 1, question: 'En la ecuación de la recta <code>y = 3x + 2</code>, ¿cuál es la pendiente?', options: ['2', '3', 'x', 'y'], correct: 1 },
    { topic: 'funciones', difficulty: 1, question: 'Si la regla de correspondencia es <code>f(x) = x + 4</code>, calcula <code>f(2)</code>', options: ['4', '6', '2', '8'], correct: 1 },
    { topic: 'funciones', difficulty: 1, question: '¿Cuál es el dominio de <code>f(x) = 1/x</code>?', options: ['Todos los reales', 'Todos los reales excepto x = 0', 'x > 0', 'x < 0'], correct: 1 },
    { topic: 'funciones', difficulty: 1, question: 'Evalúa <code>g(x) = x² - 1</code> para <code>x = -1</code>', options: ['0', '2', '-2', '1'], correct: 0 },
    { topic: 'funciones', difficulty: 1, question: 'La gráfica de <code>y = 5</code> es una línea:', options: ['Vertical', 'Horizontal', 'Diagonal creciente', 'Diagonal decreciente'], correct: 1 },
    { topic: 'funciones', difficulty: 1, question: '¿Qué tipo de función es <code>f(x) = 2x + 3</code>?', options: ['Lineal', 'Cuadrática', 'Constante', 'Racional'], correct: 0 },
    { topic: 'funciones', difficulty: 1, question: 'Calcula <code>f(0)</code> si <code>f(x) = 3x - 2</code>', options: ['-2', '0', '3', '2'], correct: 0 },
    { topic: 'funciones', difficulty: 1, question: 'La ordenada al origen de <code>y = 4x + 1</code> es:', options: ['4', '1', 'x', '0'], correct: 1 },
    { topic: 'funciones', difficulty: 1, question: '¿Cuál es la imagen de <code>-2</code> en <code>h(x) = |x|</code>?', options: ['-2', '2', '0', '4'], correct: 1 },
    { topic: 'funciones', difficulty: 1, question: 'El dominio de una función polinómica es:', options: ['Números naturales', 'Números enteros', 'Todos los reales', 'Solo positivos'], correct: 2 },

    // --- Medias (8) ---
    { topic: 'funciones', difficulty: 2, question: 'Si <code>f(x) = 2x + 5</code>, calcula el valor evaluado <code>f(4)</code>', options: ['9', '11', '13', '15'], correct: 2 },
    { topic: 'funciones', difficulty: 2, question: 'El vértice de la parábola base <code>f(x) = x²</code> se localiza en el punto:', options: ['(1,1)', '(0,0)', '(2,4)', '(-1,1)'], correct: 1 },
    { topic: 'funciones', difficulty: 2, question: 'Encuentra el dominio de <code>f(x) = √(x - 3)</code>', options: ['x ≥ 3', 'x > 3', 'Todos los reales', 'x ≤ 3'], correct: 0 },
    { topic: 'funciones', difficulty: 2, question: '¿Cuál es el rango de <code>f(x) = x²</code>?', options: ['Todos los reales', 'y ≥ 0', 'y > 0', 'y ≤ 0'], correct: 1 },
    { topic: 'funciones', difficulty: 2, question: 'Si <code>f(x) = 3x - 1</code>, halla <code>f(x+1)</code>', options: ['3x + 2', '3x - 2', '3x', '3x + 4'], correct: 0 },
    { topic: 'funciones', difficulty: 2, question: 'La función <code>f(x) = x³</code> es:', options: ['Par', 'Impar', 'Constante', 'Periódica'], correct: 1 },
    { topic: 'funciones', difficulty: 2, question: 'Determina la intersección con el eje y de <code>f(x) = x² - 4x + 3</code>', options: ['(0,3)', '(3,0)', '(0,-4)', '(0,1)'], correct: 0 },
    { topic: 'funciones', difficulty: 2, question: 'Si <code>f(x) = 2ˣ</code>, entonces <code>f(3)</code> es:', options: ['6', '8', '9', '5'], correct: 1 },

    // --- Difíciles (5) ---
    { topic: 'funciones', difficulty: 3, question: '¿Cuál es el dominio real de la función racional <code>f(x) = 5 / (x - 2)</code>?', options: ['Todos los reales', 'Todos los reales excepto x = 2', 'Todos los reales excepto x = 0', 'x > 2'], correct: 1 },
    { topic: 'funciones', difficulty: 3, question: 'Encuentra la inversa de <code>f(x) = (x - 1)/2</code>', options: ['f⁻¹(x) = 2x + 1', 'f⁻¹(x) = 2x - 1', 'f⁻¹(x) = (x + 1)/2', 'f⁻¹(x) = x/2 + 1'], correct: 0 },
    { topic: 'funciones', difficulty: 3, question: 'Halla el dominio de <code>f(x) = ln(x + 2)</code>', options: ['x > -2', 'x ≥ -2', 'x > 0', 'Todos los reales'], correct: 0 },
    { topic: 'funciones', difficulty: 3, question: 'La composición <code>(f ∘ g)(x)</code> si <code>f(x) = 2x + 1</code> y <code>g(x) = x²</code> es:', options: ['2x² + 1', '(2x + 1)²', '2x² + 2', 'x² + 1'], correct: 0 },
    { topic: 'funciones', difficulty: 3, question: 'Identifica la asíntota vertical de <code>f(x) = (x+1)/(x-3)</code>', options: ['x = 3', 'y = 1', 'x = -1', 'y = 3'], correct: 0 },

    // ================================================
    // INECUACIONES
    // ================================================
    // --- Fáciles (10) ---
    { topic: 'inecuaciones', difficulty: 1, question: 'Resuelve la desigualdad lineal: <code>x + 3 > 7</code>', options: ['x > 10', 'x > 4', 'x < 4', 'x >= 4'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 1, question: '¿Qué símbolo representa "menor o igual que"?', options: ['>', '<', '>=', '<='], correct: 3 },
    { topic: 'inecuaciones', difficulty: 1, question: 'Resuelve: <code>2x ≤ 10</code>', options: ['x ≤ 5', 'x ≥ 5', 'x < 5', 'x = 5'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 1, question: '¿Cuál es la solución de <code>-x > 3</code>?', options: ['x > -3', 'x < -3', 'x < 3', 'x > 3'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 1, question: 'Representa <code>x ≥ 2</code> en intervalo:', options: ['(2, ∞)', '[2, ∞)', '(-∞, 2]', '(2, ∞]'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 1, question: 'Si <code>5x < 20</code>, entonces:', options: ['x < 4', 'x > 4', 'x ≤ 4', 'x = 4'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 1, question: 'La desigualdad <code>3 > x</code> es equivalente a:', options: ['x < 3', 'x > 3', 'x ≤ 3', 'x ≥ 3'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 1, question: 'Resuelve: <code>x/2 ≥ 5</code>', options: ['x ≥ 10', 'x ≤ 10', 'x > 10', 'x ≥ 5/2'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 1, question: 'El intervalo (-2, 5] incluye:', options: ['-2 pero no 5', '5 pero no -2', 'ni -2 ni 5', 'ambos extremos'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 1, question: '¿Cuál es la notación de "x es como máximo 7"?', options: ['x < 7', 'x ≤ 7', 'x ≥ 7', 'x > 7'], correct: 1 },

    // --- Medias (8) ---
    { topic: 'inecuaciones', difficulty: 2, question: 'Resuelve la inecuación: <code>-2x < 6</code> (¡Cuidado con el sentido!)', options: ['x < -3', 'x > -3', 'x < 3', 'x > 3'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 2, question: 'El intervalo cerrado de números reales entre 1 y 5 se denota como:', options: ['(1, 5)', '[1, 5]', '(1, 5]', '[1, 5)'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 2, question: 'Resuelve: <code>3x - 1 ≥ 5x + 3</code>', options: ['x ≤ -2', 'x ≥ -2', 'x ≤ 2', 'x ≥ 2'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 2, question: 'La solución de <code>2 ≤ x < 6</code> en intervalo es:', options: ['[2, 6]', '[2, 6)', '(2, 6]', '(2, 6)'], correct: 1 },
    { topic: 'inecuaciones', difficulty: 2, question: 'Resuelve: <code>5 - x > 2</code>', options: ['x < 3', 'x > 3', 'x < 7', 'x > 7'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 2, question: '¿Para qué valores de x se cumple <code>|x| < 4</code>?', options: ['x < 4', 'x > -4', '-4 < x < 4', 'x < -4 o x > 4'], correct: 2 },
    { topic: 'inecuaciones', difficulty: 2, question: 'Resuelve la inecuación cuadrática: <code>x² - 4 ≥ 0</code>', options: ['x ≥ 2', 'x ≤ -2', 'x ≤ -2 o x ≥ 2', '-2 ≤ x ≤ 2'], correct: 2 },
    { topic: 'inecuaciones', difficulty: 2, question: 'El conjunto solución de <code>1/x > 0</code> es:', options: ['x > 0', 'x < 0', 'x ≠ 0', 'Todos los reales'], correct: 0 },

    // --- Difíciles (5) ---
    { topic: 'inecuaciones', difficulty: 3, question: 'Resuelve la desigualdad compuesta: <code>1 < 2x - 1 ≤ 5</code>', options: ['1 < x ≤ 3', '0 < x ≤ 2', '2 < x ≤ 6', '1 ≤ x < 3'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 3, question: 'Resuelve: <code>(x - 2)/(x + 1) ≤ 0</code>', options: ['(-1, 2]', '[-1, 2]', '(-∞, -1) ∪ [2, ∞)', '(-1, 2)'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 3, question: 'Encuentra la solución de <code>|2x - 3| ≥ 5</code>', options: ['x ≤ -1 o x ≥ 4', 'x ≤ -4 o x ≥ 1', '-1 ≤ x ≤ 4', 'x ≥ 4'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 3, question: 'Resuelve el sistema de inecuaciones: <code>x > 3</code> y <code>x ≤ 7</code>', options: ['(3, 7]', '[3, 7)', '(3, 7)', '[3, 7]'], correct: 0 },
    { topic: 'inecuaciones', difficulty: 3, question: 'Halla los valores de x para que <code>x² - 5x + 6 > 0</code>', options: ['x < 2 o x > 3', '2 < x < 3', 'x > 0', 'x < 3'], correct: 0 }
  ];

  /* ============================================================
     VARIABLES DE CONTROL DEL FLUJO MULTITEMA
     ============================================================ */
  let currentTopicIdx = 0;   // Índice del tema actual dentro de TOPICS_LIST (0 a 9)
  let diagnosticMode = 'perception'; // 'perception' (pide nivel del tema) o 'quiz' (ejecuta las 3 preguntas del tema)
  let activeQuestions = [];  // Arreglo de 3 preguntas seleccionadas para el tema actual
  let currentQuestionIdx = 0;// Índice de la pregunta dentro del set activo (0 a 2)

  /* ============================================================
     MÉTODOS DE SOPORTE E INYECCIÓN DE INTERFAZ DINÁMICA
     ============================================================ */
  
  // Algoritmo Fisher-Yates para aleatorizar conjuntos de preguntas preservando filtros
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  // Despachador de pasos de registro general
  window.gotoStep = function(step) {
    document.querySelectorAll('.register-step').forEach(s => s.classList.remove('active'));
    const targetedStep = document.getElementById(`step${step}`);
    if (targetedStep) targetedStep.classList.add('active');

    // Sincronización visual de la barra de progreso superior
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`dot${i}`);
      const lbl = document.getElementById(`label${i}`);
      const line = document.getElementById(`line${i}`);
      
      if (dot) {
        if (i <= step) dot.classList.add('active');
        else dot.classList.remove('active');
      }
      if (lbl) {
        if (i === step) lbl.classList.add('active');
        else lbl.classList.remove('active');
      }
      if (line) {
        if (i < step) line.classList.add('active');
        else line.classList.remove('active');
      }
    }

    if (step === 3) startAdaptiveDiagnostic();
  };

  /* ============================================================
     PASO 1: VALIDACIÓN Y EVENTO SUBMIT FORM CUENTA
     ============================================================ */
  regStep1.addEventListener('submit', (e) => {
    e.preventDefault();
    regState.fullname = document.getElementById('regFullname').value.trim();
    regState.password = document.getElementById('regPassword').value;

    // Generar email sintético: nombre sin espacios + timestamp + dominio interno
    const baseName = regState.fullname.replace(/\s+/g, '_').toLowerCase() || 'user';
    regState.email = `${baseName}_${Date.now()}@eduadapt.internal`;

    if (regState.password.length < 6) {
      const err = document.getElementById('accountError');
      document.getElementById('accountErrorText').textContent = "La contraseña debe tener mínimo 6 caracteres";
      if (err) err.style.display = 'flex';
      return;
    }
    gotoStep(2);
  });

  /* ============================================================
     PASO 2: SELECCIÓN DE PREFERENCIAS Y TIEMPO
     ============================================================ */
  window.togglePref = function(pref) {
      const idx = regState.preferences.indexOf(pref);
      if (idx > -1) {
          regState.preferences.splice(idx, 1);
      } else {
          regState.preferences.push(pref);
      }
      window.event.currentTarget.classList.toggle('selected');   // ← window.event
      validateStep2Completion();
  };

  window.setStudyTime = function(timeKey) {
      regState.studyTime = timeKey;
      document.querySelectorAll('.time-options .time-card').forEach(btn => btn.classList.remove('selected'));
      window.event.currentTarget.classList.add('selected');      // ← window.event
      validateStep2Completion();
  };

  function validateStep2Completion() {
      const nextBtn = document.getElementById('next2');
      if (regState.preferences.length > 0) {   // Ya no pedimos studyTime
          nextBtn.removeAttribute('disabled');
      } else {
          nextBtn.setAttribute('disabled', 'true');
      }
  }

  /* ============================================================
     PASO 3: MOTOR DIAGNÓSTICO ADAPTATIVO CON RECOLECCIÓN POR TEMA
     ============================================================ */
  function startAdaptiveDiagnostic() {
    currentTopicIdx = 0;
    regState.quizAnswers = [];
    regState.topicSelfLevels = {};
    renderDiagnosticFlow();
  }

  function renderDiagnosticFlow() {
    if (currentTopicIdx >= TOPICS_LIST.length) {
      // Hemos terminado las mediciones y cuestionarios de los 10 temas
      finalizeRegistration();
      return;
    }

    const currentTopic = TOPICS_LIST[currentTopicIdx];
    
    // Cálculo e inyección de la barra de progreso interna del diagnóstico acumulado
    // Total de estados intermedios = 10 temas * 2 vistas (autopercepción + set de preguntas)
    const totalStates = TOPICS_LIST.length * 2;
    const currentStateProgress = (diagnosticMode === 'perception') ? (currentTopicIdx * 2) : (currentTopicIdx * 2 + 1);
    const progressPercent = (currentStateProgress / totalStates) * 100;
    
    document.getElementById('quizCounter').textContent = `Módulo ${currentTopicIdx + 1} de ${TOPICS_LIST.length}: ${currentTopic.toUpperCase()}`;
    document.getElementById('quizBarFill').style.width = `${progressPercent}%`;

    const container = document.getElementById('diagnosticDynamicContainer');

    if (diagnosticMode === 'perception') {
      // Inyección de la tarjeta de medición de la autopercepción para el tema en cuestión
      container.innerHTML = `
        <div class="login-heading">
          <h2 style="font-size: 1.4rem; color: #fff;">Autopercepción de Conocimiento</h2>
          <p>¿Cómo calificarías tu dominio actual en el tema: <strong style="color:#3B82F6; text-transform:uppercase;">${currentTopic}</strong>?</p>
        </div>
        <div class="level-options" style="margin-top: 20px;">
          <div class="level-card" onclick="submitTopicPerception('${currentTopic}', 'low')">
            <div class="level-icon level-low">📐</div>
            <div class="level-title">Bajo / Nulo</div>
            <div class="level-desc">No conozco el tema o necesito aprenderlo desde los cimientos elementales.</div>
          </div>
          <div class="level-card" onclick="submitTopicPerception('${currentTopic}', 'mid')">
            <div class="level-icon level-mid">📖</div>
            <div class="level-title">Medio / Intermedio</div>
            <div class="level-desc">Recuerdo las bases y puedo resolver operaciones de complejidad típica.</div>
          </div>
          <div class="level-card" onclick="submitTopicPerception('${currentTopic}', 'high')">
            <div class="level-icon level-high">💡</div>
            <div class="level-title">Alto / Avanzado</div>
            <div class="level-desc">Domino con fluidez el tema y busco retos complejos o prácticos avanzados.</div>
          </div>
        </div>
      `;
    } else if (diagnosticMode === 'quiz') {
      // Inyección de la pregunta activa correspondiente al bloque asignado al tema
      const q = activeQuestions[currentQuestionIdx];
      container.innerHTML = `
        <div class="quiz-q">
          <p class="quiz-num" style="font-size: 0.85rem; color: #94A3B8;">
            Evaluación Tema: <span style="text-transform: uppercase; font-weight:600; color:#3B82F6;">${currentTopic}</span> 
            (Pregunta ${currentQuestionIdx + 1} de 3)
          </p>
          <h3 style="margin: 15px 0; font-size: 1.15rem; color:#F8FAFC;">${q.question}</h3>
          <div class="quiz-options" style="display: flex; flex-direction: column; gap: 10px;">
            ${q.options.map((opt, i) => `
              <button class="opt-btn" style="text-align:left; padding: 12px 16px;" onclick="selectAdaptiveOption(${i})">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  window.submitTopicPerception = function(topic, level) {
    regState.topicSelfLevels[topic] = level;
    
    // Filtrar y extraer preguntas específicas de este tema desde nuestro banco general
    const topicBank = COMPREHENSIVE_BANK.filter(q => q.topic === topic);
    const easyQ = shuffleArray(topicBank.filter(q => q.difficulty === 1));
    const midQ = shuffleArray(topicBank.filter(q => q.difficulty === 2));
    const hardQ = shuffleArray(topicBank.filter(q => q.difficulty === 3));

    activeQuestions = [];

    // Lógica pedagógica de ensamble adaptativo basado en autopercepción:
    if (level === 'low') {
      // 2 Fáciles y 1 Media
      activeQuestions.push(...easyQ.slice(0, 2));
      activeQuestions.push(...midQ.slice(0, 1));
      activeQuestions.push(...hardQ.slice(0, 0));
    } else if (level === 'mid') {
      // 1 Fácil, 1 Media y 1 Difícil
      activeQuestions.push(...easyQ.slice(0, 1));
      activeQuestions.push(...midQ.slice(0, 1));
      activeQuestions.push(...hardQ.slice(0, 1));
    } else if (level === 'high') {
      // 1 Media y 2 Difíciles
      activeQuestions.push(...easyQ.slice(0, 0));
      activeQuestions.push(...midQ.slice(0, 1));
      activeQuestions.push(...hardQ.slice(0, 2));
    }

    // Aseguramos reordenamiento aleatorio interno de las 3 preguntas finales para evitar patrones repetitivos
    activeQuestions = shuffleArray(activeQuestions);

    // Transicionar al quiz del bloque de este tema
    diagnosticMode = 'quiz';
    currentQuestionIdx = 0;
    renderDiagnosticFlow();
  };

  window.selectAdaptiveOption = function(selectedIdx) {

    if (diagnosticMode !== 'quiz' || currentQuestionIdx >= activeQuestions.length) {
        return;
    }

    const q = activeQuestions[currentQuestionIdx];

    if (!q) {
      console.error('Pregunta no encontrada:', {
        currentQuestionIdx,
        activeQuestions
      });
      return;
    }
    
    // Almacenar respuesta con metadatos extendidos para la Matriz S
    regState.quizAnswers.push({
      topic: q.topic,
      difficulty: q.difficulty,
      selected: selectedIdx,
      isCorrect: selectedIdx === q.correct
    });

    currentQuestionIdx++;

    if (currentQuestionIdx < activeQuestions.length) {
      // Continuar con la siguiente pregunta de este mismo tema
      renderDiagnosticFlow();
    } else {
      // Se completaron las 3 preguntas obligatorias del tema actual, pasar al siguiente tema
      currentTopicIdx++;
      diagnosticMode = 'perception';
      renderDiagnosticFlow();
    }
  };

  /* ============================================================
     SISTEMA ACADÉMICO: CONSTRUCCIÓN DE LA MATRIZ S Y CÁLCULO ADAPTATIVO
     ============================================================ */
  function buildMatrixS() {
    const matrixS = [];

    TOPICS_LIST.forEach(topic => {
      // Obtener las 3 respuestas asociadas a este tema específico
      const topicAnswers = regState.quizAnswers.filter(a => a.topic === topic);
      const totalQuestions = topicAnswers.length || 3;
      const correctCount = topicAnswers.filter(a => a.isCorrect).length;
      
      // Rendimiento porcentual del estudiante en el tema
      const scorePercentage = (correctCount / totalQuestions) * 100;
      
      // Recorrer respuestas consecutivas para establecer la racha (streak)
      let streak = 0;
      topicAnswers.forEach(ans => {
        if (ans.isCorrect) streak = streak >= 0 ? streak + 1 : 1;
        else streak = streak <= 0 ? streak - 1 : -1;
      });

      // Cálculo del Mastery Inicial Base (Fórmula clásica ajustada con pesos)
      let mastery = 0.5;
      topicAnswers.forEach(ans => {
        const weight = LEARNING_RATE * ans.difficulty;
        mastery += ans.isCorrect ? weight : -weight;
      });
      mastery = clamp(mastery);

      // Nivel autoperpercibido registrado
      const selfLevel = regState.topicSelfLevels[topic] || 'mid';

      /* ------------------------------------------------------------
         LÓGICA ADAPTATIVA SOLICITADA DE RELACIÓN DE NIVELES (Matriz S)
         Se evalúa el rendimiento contra el nivel autopercibido
         ------------------------------------------------------------ */
      let finalCalculatedLevel = '';

      if (scorePercentage < 60) {
        // Si responde menor al 60%, se le ubica estrictamente en el nivel en que se autopercibe
        if (selfLevel === 'low') finalCalculatedLevel = 'Básico';
        if (selfLevel === 'mid') finalCalculatedLevel = 'Intermedio';
        if (selfLevel === 'high') finalCalculatedLevel = 'Avanzado';
      } 
      else if (scorePercentage >= 60 && scorePercentage < 100) {
        // Puntuación mayor al 60% y menor al 100%: Nivel intermedio 'entre' el nivel que seleccionó
        if (selfLevel === 'low') finalCalculatedLevel = 'Básico - Intermedio';
        if (selfLevel === 'mid') finalCalculatedLevel = 'Intermedio - Avanzado';
        if (selfLevel === 'high') finalCalculatedLevel = 'Avanzado - Experto';
      } 
      else if (scorePercentage === 100) {
        // Responde todo correcto (100%): Nivel intermedio entre el que seleccionó y el que le sigue (si aplica)
        if (selfLevel === 'low') finalCalculatedLevel = 'Intermedio'; 
        if (selfLevel === 'mid') finalCalculatedLevel = 'Avanzado';
        if (selfLevel === 'high') finalCalculatedLevel = 'Experto Máximo';
      }

      const confidence = clamp(totalQuestions / 10);
      const lastInteraction = new Date().toISOString();

      // Construcción exacta de la fila de la matriz para el tema iterado
      // Formato estructural: [Tema, Mastery, Confidence, Intentos, Correctas, Racha, ÚltimaInteracción, NivelCalculado]
      const rowItem = [
        topic,
        parseFloat(mastery.toFixed(3)),
        parseFloat(confidence.toFixed(3)),
        totalQuestions,
        correctCount,
        streak,
        lastInteraction,
        finalCalculatedLevel
      ];

      matrixS.push(rowItem);
    });

    return matrixS;
  }

  /* ============================================================
     FINALIZACIÓN DE FLUJO: PERSISTENCIA EN CLOUD FIRESTORE
     ============================================================ */
  async function finalizeRegistration() {
    const errDiv = document.getElementById('submitError');
    if (errDiv) {
      errDiv.style.display = 'none';
      errDiv.innerHTML = '';
    }

    try {
      /* 1. REGISTRO AUTH EN FIREBASE */
      const user = await registerWithEmail(regState.email, regState.password);

      /* 2. PROCESAMIENTO Y CREACIÓN DE MATRIZ S */
      const processedMatrixS = buildMatrixS();

      /* 3. GUARDADO DIRECTO EN CLOUD FIRESTORE */
      const userRef = window.fbHelpers.doc(window.fbDb, 'users', user.uid);

      const firestoreCompatibleS = processedMatrixS.map(row => ({
          topic:          row[0],
          mastery:        row[1],
          confidence:     row[2],
          attempts:       row[3],
          correct:        row[4],
          streak:         row[5],
          lastInteraction: row[6],
          level:          row[7]
      }));

      // Usar firestoreCompatibleS en lugar de processedMatrixS
      await window.fbHelpers.setDoc(userRef, {
          fullname: regState.fullname,
          email: regState.email,
          preferences: regState.preferences,
          S: firestoreCompatibleS,
          diagnosticAnswersRaw: regState.quizAnswers,
          createdAt: window.fbHelpers.serverTimestamp()
      });

      const usernameRef = window.fbHelpers.doc(window.fbDb, 'usernames', regState.fullname);
      await window.fbHelpers.setDoc(usernameRef, { email: regState.email });

      /* 4. CREACIÓN Y CONTROL DE SESIÓN LOCAL */
      sessionStorage.setItem('edu_logged', '1');
      sessionStorage.setItem('edu_user', regState.fullname);
      sessionStorage.setItem('edu_uid', user.uid);
      sessionStorage.setItem('edu_S', JSON.stringify(processedMatrixS));

      /* 5. ACTUALIZACIÓN DINÁMICA DE LA UI DE RESULTADOS EN PASO 4 */
      const infoFinal = document.getElementById('infoFinal');
      if (infoFinal) {
          // Para cada tema, el dominio se calcula a partir del score (correctCount/total *100)
          const topicsWithScores = processedMatrixS.map(row => {
              const topic = row[0];
              const mastery = row[1]; // 0-1
              const total = row[3];
              const correct = row[4];
              const scorePercent = total > 0 ? (correct / total) * 100 : 0;
              const level = row[7];
              return { topic, mastery, scorePercent, level };
          });

          // Construir las barras
          const barsHTML = topicsWithScores.map(item => {
              let color = '#EF4444'; // rojo <60
              if (item.scorePercent >= 60 && item.scorePercent < 80) color = '#F59E0B'; // amarillo
              else if (item.scorePercent >= 80) color = '#10B981'; // verde

              return `
              <div class="topic-bar-item" style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #CBD5E1; margin-bottom: 3px;">
                      <span style="text-transform: capitalize; font-weight: 500;">${item.topic}</span>
                      <span style="color: ${color}; font-weight: 600;">${Math.round(item.scorePercent)}%</span>
                  </div>
                  <div style="background: #1E293B; border-radius: 10px; height: 8px; width: 100%; overflow: hidden;">
                      <div style="width: ${Math.round(item.scorePercent)}%; height: 100%; background: ${color}; border-radius: 10px; transition: width 0.3s;"></div>
                  </div>
                  <div style="font-size: 0.7rem; color: #64748B; margin-top: 2px;">Nivel: ${item.level}</div>
              </div>`;
          }).join('');

          // Identificar ruta crítica (temas con scorePercent < 60)
          const criticalTopics = topicsWithScores
              .filter(item => item.scorePercent < 60)
              .map(item => item.topic.toUpperCase());

          const criticalHTML = criticalTopics.length > 0
              ? `<div style="margin-top: 18px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #EF4444; padding: 10px; border-radius: 6px;">
                  <span style="font-weight: 600; color: #EF4444; font-size: 0.85rem;">⚠️ Ruta crítica</span>
                  <p style="font-size: 0.8rem; color: #FCA5A5; margin: 4px 0 0;">${criticalTopics.join(', ')}</p>
                </div>`
              : `<div style="margin-top: 18px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; padding: 10px; border-radius: 6px;">
                  <span style="font-weight: 600; color: #10B981; font-size: 0.85rem;">✅ Sin temas críticos</span>
                </div>`;

          infoFinal.innerHTML = `
              <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 10px;">Desglose por tema</div>
              ${barsHTML}
              ${criticalHTML}
              <div style="margin-top: 12px; font-size: 0.75rem; color: #64748B; display: flex; justify-content: space-between;">
                  <span>Estudiante: ${regState.fullname}</span>
                  <span>✓ Perfil guardado</span>
              </div>
          `;
      }

      // Transicionar finalmente al render de resultados del paso 4
      gotoStep(4);

    } catch (error) {
      console.error('[Adaptive Register] Error Crítico:', error);
      let mensaje = 'Ocurrió un error inesperado al procesar tu cuenta.';
      
      if (error && error.code === 'auth/email-already-in-use') {
        mensaje = 'Este correo electrónico ya se encuentra registrado.';
      }

      if (errDiv) {
        errDiv.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>${mensaje}</span>`;
        errDiv.style.display = 'flex';
      }
      
      // Hacer un rollback al paso 1 en caso de error de autenticación para que corrijan los datos
      gotoStep(1);
    }
  }

  // Vincular manejador al botón finalizador del flujo en el HTML
  const finalRedirectBtn = document.getElementById('goToApp');
  if (finalRedirectBtn) {
    finalRedirectBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }
}