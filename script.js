/* ============================================================
   EduAdapt AI – script.js
   Firebase Auth + Firestore + Banco de preguntas de Álgebra
   Sistema adaptativo S = [a, t, f, d]
   ============================================================ */

function onFirebaseReady(callback) {
  if (window.firebaseReady) callback();
  else window.addEventListener('firebase-ready', callback, { once: true });
}

/* ============================================================
   BANCO DE PREGUNTAS DE ÁLGEBRA (v3)
   Fuente: Banco_preguntas_Algebra_EduAdaptAI_v3.xlsx
   ============================================================ */
const QUESTION_BANK = {
  polinomios: [
    { id:'POL-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué significa "términos semejantes" en un polinomio?',
      answer:'Son términos con la misma parte literal (mismas variables con los mismos exponentes); solo cambian los coeficientes.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/5-1-add-and-subtract-polynomials' },
    { id:'POL-02', type:'Procedural', difficulty:'Easy',
      question:'Simplifica: (3x² + 2x) + (5x² − 7x)',
      answer:'8x² − 5x',
      link:'https://www.khanacademy.org/math/algebra-home/alg-polynomials' },
    { id:'POL-03', type:'Procedural', difficulty:'Easy',
      question:'Simplifica: (4x − 3) − (x + 5)',
      answer:'3x − 8',
      link:'https://www.khanacademy.org/math/algebra-home/alg-polynomials' },
    { id:'POL-04', type:'Procedural', difficulty:'Medium',
      question:'Multiplica: (x + 4)(x − 1)',
      answer:'x² + 3x − 4',
      link:'https://www.khanacademy.org/math/algebra-home/alg-polynomials' },
    { id:'POL-05', type:'Procedural', difficulty:'Medium',
      question:'Multiplica: (2x + 3)(x − 5)',
      answer:'2x² − 7x − 15',
      link:'https://www.khanacademy.org/math/algebra-home/alg-polynomials' },
    { id:'POL-06', type:'Conceptual', difficulty:'Medium',
      question:'¿Cuál es el error más común al restar polinomios?',
      answer:'No distribuir correctamente el signo "−" a todos los términos del segundo paréntesis.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/5-1-add-and-subtract-polynomials' },
    { id:'POL-07', type:'Procedural', difficulty:'Hard',
      question:'Expande y simplifica: (x + 2)³',
      answer:'x³ + 6x² + 12x + 8',
      link:'https://www.khanacademy.org/math/algebra-home/alg-polynomials' },
  ],
  factorizacion: [
    { id:'FAC-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué es factorizar?',
      answer:'Reescribir una expresión como un producto de factores; es la operación inversa de multiplicar.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/6-2-factor-trinomials' },
    { id:'FAC-02', type:'Procedural', difficulty:'Easy',
      question:'Factoriza: 5x + 10',
      answer:'5(x + 2)',
      link:'https://www.khanacademy.org/kmap/numerical-algebraic-expressions-d/x47f8e7cc3f3bd017:factoring-polynomials' },
    { id:'FAC-03', type:'Conceptual', difficulty:'Medium',
      question:'¿Cómo identificas si un trinomio es un cuadrado perfecto?',
      answer:'Si tiene la forma a² ± 2ab + b²; el primer y tercer término son cuadrados perfectos y el término central es el doble del producto de sus raíces.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/6-4-factor-special-products' },
    { id:'FAC-04', type:'Procedural', difficulty:'Medium',
      question:'Factoriza: x² − 9',
      answer:'(x − 3)(x + 3)',
      link:'https://www.khanacademy.org/kmap/numerical-algebraic-expressions-d/x47f8e7cc3f3bd017:factoring-polynomials' },
    { id:'FAC-05', type:'Procedural', difficulty:'Medium',
      question:'Factoriza: x² + 7x + 12',
      answer:'(x + 3)(x + 4)',
      link:'https://www.khanacademy.org/kmap/numerical-algebraic-expressions-d/x47f8e7cc3f3bd017:factoring-polynomials' },
    { id:'FAC-06', type:'Procedural', difficulty:'Medium',
      question:'Factoriza: x² − 6x + 9',
      answer:'(x − 3)²',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/6-4-factor-special-products' },
    { id:'FAC-07', type:'Procedural', difficulty:'Hard',
      question:'Factoriza: 2x² + 5x + 3',
      answer:'(2x + 3)(x + 1)',
      link:'https://www.purplemath.com/modules/factquad2.htm' },
  ],
  ecuaciones: [
    { id:'EQL-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué significa "resolver una ecuación"?',
      answer:'Encontrar el/los valores de la variable que hacen verdadera la igualdad.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/2-1-use-a-general-strategy-to-solve-linear-equations' },
    { id:'EQL-02', type:'Procedural', difficulty:'Easy',
      question:'Resuelve: 2x + 5 = 17',
      answer:'x = 6',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-equations' },
    { id:'EQL-03', type:'Procedural', difficulty:'Easy',
      question:'Resuelve: 3x − 4 = 11',
      answer:'x = 5',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-equations' },
    { id:'EQL-04', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: 5(x − 2) = 15',
      answer:'x = 5',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-equations' },
    { id:'EQL-05', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: x/4 + 3 = 7',
      answer:'x = 16',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-equations' },
    { id:'EQL-06', type:'Conceptual', difficulty:'Medium',
      question:'¿Cuándo decimos que una ecuación lineal tiene infinitas soluciones?',
      answer:'Cuando al simplificar ambos lados se obtiene una identidad (por ejemplo, 0 = 0); la ecuación es siempre verdadera.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/2-1-use-a-general-strategy-to-solve-linear-equations' },
    { id:'EQL-07', type:'Procedural', difficulty:'Hard',
      question:'Resuelve: 2(3x − 1) − (x + 4) = 10',
      answer:'x = 3',
      link:'https://www.purplemath.com/modules/solvelin.htm' },
  ],
  sistemas: [
    { id:'SYS-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué representa la solución de un sistema 2×2?',
      answer:'Un par ordenado (x, y) que satisface ambas ecuaciones al mismo tiempo.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/4-1-solve-systems-of-linear-equations-with-two-variables' },
    { id:'SYS-02', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: { x + y = 5,  x − y = 1 }',
      answer:'x = 3, y = 2',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations' },
    { id:'SYS-03', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: { 2x + y = 9,  x + y = 6 }',
      answer:'x = 3, y = 3',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations' },
    { id:'SYS-04', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: { 3x − y = 8,  x + y = 6 }',
      answer:'x = 3.5, y = 2.5',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations' },
    { id:'SYS-05', type:'Conceptual', difficulty:'Medium',
      question:'¿Cuándo un sistema no tiene solución?',
      answer:'Cuando las rectas son paralelas (inconsistente): no se cruzan.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/4-1-solve-systems-of-linear-equations-with-two-variables' },
    { id:'SYS-06', type:'Procedural', difficulty:'Hard',
      question:'Resuelve por sustitución: { y = 2x − 1,  3x + y = 14 }',
      answer:'x = 3, y = 5',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations' },
    { id:'SYS-07', type:'Procedural', difficulty:'Hard',
      question:'Resuelve: { 2x + 3y = 13,  4x − y = 5 }',
      answer:'x = 2, y = 3',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations' },
  ],
  fracciones: [
    { id:'FRA-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué condición debe cumplir el denominador de una fracción algebraica?',
      answer:'No puede ser igual a cero (restricción del dominio).',
      link:'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:rational-expressions' },
    { id:'FRA-02', type:'Procedural', difficulty:'Easy',
      question:'Simplifica: (6x²) / (3x)  (x ≠ 0)',
      answer:'2x',
      link:'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:rational-expressions' },
    { id:'FRA-03', type:'Procedural', difficulty:'Easy',
      question:'Suma: 2/x + 3/x  (x ≠ 0)',
      answer:'5/x',
      link:'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:rational-expressions' },
    { id:'FRA-04', type:'Procedural', difficulty:'Medium',
      question:'Simplifica: (x² − 9) / (x − 3)  (x ≠ 3)',
      answer:'x + 3',
      link:'https://www.purplemath.com/modules/rtnldefs.htm' },
    { id:'FRA-05', type:'Procedural', difficulty:'Hard',
      question:'Simplifica: (x² − 4) / (x² + 2x)  (x ≠ 0, −2)',
      answer:'(x − 2) / x',
      link:'https://www.purplemath.com/modules/rtnldefs.htm' },
    { id:'FRA-06', type:'Procedural', difficulty:'Hard',
      question:'Resta: 1/x − 1/(x+1)  (x ≠ 0, −1)',
      answer:'1 / (x(x+1))',
      link:'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:rational-expressions' },
    { id:'FRA-07', type:'Conceptual', difficulty:'Hard',
      question:'¿Por qué no se puede cancelar x en (x+2)/x aunque x aparezca en ambos?',
      answer:'Porque x no es un factor del numerador; es un sumando. Solo se cancelan factores (multiplicativos), no sumandos.',
      link:'https://www.purplemath.com/modules/rtnldefs.htm' },
  ],
  potencias: [
    { id:'POW-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué pasa con los exponentes al multiplicar potencias de la misma base?',
      answer:'Se suman: xᵃ · xᵇ = xᵃ⁺ᵇ  (x ≠ 0).',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponents-radicals' },
    { id:'POW-02', type:'Procedural', difficulty:'Easy',
      question:'Simplifica: x³ · x²',
      answer:'x⁵',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponents-radicals' },
    { id:'POW-03', type:'Procedural', difficulty:'Easy',
      question:'Simplifica: x⁵ / x²  (x ≠ 0)',
      answer:'x³',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponents-radicals' },
    { id:'POW-04', type:'Procedural', difficulty:'Medium',
      question:'Simplifica: (2x²)³',
      answer:'8x⁶',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponents-radicals' },
    { id:'POW-05', type:'Procedural', difficulty:'Medium',
      question:'Simplifica: √(49x²)  (x ≥ 0)',
      answer:'7x',
      link:'https://www.purplemath.com/modules/radicals.htm' },
    { id:'POW-06', type:'Procedural', difficulty:'Medium',
      question:'Simplifica: √18',
      answer:'3√2',
      link:'https://www.purplemath.com/modules/radicals.htm' },
    { id:'POW-07', type:'Procedural', difficulty:'Hard',
      question:'Simplifica: (x⁻² · x⁵) / x⁰',
      answer:'x³',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponents-radicals' },
  ],
  funciones: [
    { id:'FUN-01', type:'Conceptual', difficulty:'Easy',
      question:'¿Qué representa la pendiente (m) en y = mx + b?',
      answer:'La tasa de cambio: cuánto cambia y por cada 1 unidad que cambia x.',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-functions' },
    { id:'FUN-02', type:'Procedural', difficulty:'Easy',
      question:'Si f(x) = 2x + 1, calcula f(3)',
      answer:'7',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-functions' },
    { id:'FUN-03', type:'Procedural', difficulty:'Easy',
      question:'Identifica la pendiente en y = −3x + 5',
      answer:'m = −3',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-functions' },
    { id:'FUN-04', type:'Conceptual', difficulty:'Medium',
      question:'¿Qué indica una pendiente negativa en una función lineal?',
      answer:'Que la función es decreciente: a medida que x aumenta, y disminuye.',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/3-5-relations-and-functions' },
    { id:'FUN-05', type:'Procedural', difficulty:'Medium',
      question:'Encuentra la recta con pendiente 2 que pasa por (0, 4)',
      answer:'y = 2x + 4',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-functions' },
    { id:'FUN-06', type:'Procedural', difficulty:'Medium',
      question:'Con puntos (1, 2) y (3, 6), halla la pendiente',
      answer:'m = 2',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-functions' },
    { id:'FUN-07', type:'Procedural', difficulty:'Medium',
      question:'Intersección con eje y de y = 4x − 9',
      answer:'b = −9  (punto: (0, −9))',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-functions' },
    { id:'FUN-08', type:'Procedural', difficulty:'Hard',
      question:'Encuentra la ecuación de la recta que pasa por (2, 5) y (4, 11)',
      answer:'y = 3x − 1',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/3-5-relations-and-functions' },
  ],
  inecuaciones: [
    { id:'INE-01', type:'Conceptual', difficulty:'Medium',
      question:'¿Qué cambia cuando divides o multiplicas una inecuación por un número negativo?',
      answer:'Se invierte el signo de la desigualdad (< ↔ >, ≤ ↔ ≥).',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/2-5-solve-linear-inequalities' },
    { id:'INE-02', type:'Procedural', difficulty:'Easy',
      question:'Resuelve: x + 3 > 10',
      answer:'x > 7',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:inequalities' },
    { id:'INE-03', type:'Procedural', difficulty:'Easy',
      question:'Resuelve: 2x ≤ 8',
      answer:'x ≤ 4',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:inequalities' },
    { id:'INE-04', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: 3x − 5 < 1',
      answer:'x < 2',
      link:'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:inequalities' },
    { id:'INE-05', type:'Procedural', difficulty:'Medium',
      question:'Resuelve: −2x ≥ 6',
      answer:'x ≤ −3',
      link:'https://www.purplemath.com/modules/ineqlin.htm' },
    { id:'INE-06', type:'Conceptual', difficulty:'Medium',
      question:'¿Cómo se representa la solución de x > 3 en la recta numérica?',
      answer:'Con un círculo abierto en 3 y flecha hacia la derecha (no incluye el 3).',
      link:'https://openstax.org/books/intermediate-algebra-2e/pages/2-5-solve-linear-inequalities' },
    { id:'INE-07', type:'Procedural', difficulty:'Hard',
      question:'Resuelve: (x − 1)/2 > 3',
      answer:'x > 7',
      link:'https://www.purplemath.com/modules/ineqlin.htm' },
  ],
};

const TOPIC_LABELS = {
  polinomios:   'Operaciones con polinomios',
  factorizacion:'Factorización',
  ecuaciones:   'Ecuaciones lineales',
  sistemas:     'Sistemas de ecuaciones',
  fracciones:   'Fracciones algebraicas',
  potencias:    'Potencias y radicales',
  funciones:    'Funciones lineales',
  inecuaciones: 'Inecuaciones',
};

/* 'adaptive' | 'baseline' */
let pilotMode = 'adaptive';

const PILOT_QUESTION_LIMIT = 5;
const PILOT_RUN_ID = 'pilot_final_2026_05';

/* ============================================================
   ADAPTIVE RECOMMENDATION ENGINE
   Based on S = [a, t, f, d]
   ============================================================ */
function getTargetDifficulty(S) {
  if (S.a >= 0.85) return 'Hard';
  if (S.a >= 0.45) return 'Medium';
  return 'Easy';
}

function getTier(S) {
  if (S.a >= 0.85) return 'Challenge';
  if (S.a >= 0.70) return 'Advancement';
  if (S.a >= 0.45) return 'Reinforcement';
  return 'Remedial';
}

function getLevelLabel(S) {
  const tier = getTier(S);
  const colors = {
    'Challenge':     { label: '🏆 Avanzado',     color: '#10B981' },
    'Advancement':   { label: '📈 Progresando',   color: '#3B82F6' },
    'Reinforcement': { label: '📚 Consolidando',  color: '#F59E0B' },
    'Remedial':      { label: '🔰 Reforzando',    color: '#EF4444' },
  };
  return colors[tier];
}

function pickQuestion(topic, S, usedIds, mode = pilotMode) {
  const pool = QUESTION_BANK[topic] || [];

  let candidates = pool.filter(q => !usedIds.has(q.id));
  if (candidates.length === 0) {
    usedIds.clear();
    candidates = [...pool];
  }

  if (mode === 'baseline') {
    // Fixed order: deliver questions in their original bank order
    return candidates[0] || null;
  }

  // adaptive: sort by target difficulty, closest match first
  const targetDiff = getTargetDifficulty(S);
  const diffOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };
  candidates.sort((a, b) => {
    const da = Math.abs(diffOrder[a.difficulty] - diffOrder[targetDiff]);
    const db = Math.abs(diffOrder[b.difficulty] - diffOrder[targetDiff]);
    return da - db;
  });

  return candidates[0] || null;
}

function updateS(S, wasCorrect, responseTimeSec) {
  // a: accuracy exponential moving average
  const alpha = 0.3;
  const newA = +(alpha * (wasCorrect ? 1 : 0) + (1 - alpha) * S.a).toFixed(2);

  // t: normalized speed indicator (1.0 at <=20s, 0.0 at >=120s, linear between)
  const clamped   = Math.max(20, Math.min(120, responseTimeSec ?? 120));
  const timeScore = +(1 - (clamped - 20) / 100).toFixed(4);
  const newT = +(0.3 * timeScore + 0.7 * S.t).toFixed(2);

  // f: frequency, normalized increment over ~20 interactions
  const newF = Math.min(+(S.f + 0.05).toFixed(2), 1.0);

  // d: domain = weighted combination of accuracy, speed and self-level
  const selfMap = { low: 0.3, mid: 0.6, high: 0.9 };
  const selfVal = selfMap[S.selfLevel] || 0.5;
  const newD = +(0.5 * newA + 0.2 * newT + 0.3 * selfVal).toFixed(2);

  return { ...S, a: newA, t: newT, f: newF, d: newD };
}

/* ============================================================
   UTILITIES
   ============================================================ */
function formatTime() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : 'E';
}
function renderText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--blue);text-decoration:underline;">$1</a>');
}

/* ============================================================
   MATH EVALUATOR (top-level for testability)
   ============================================================ */
function normalizeMathText(text) {
  return text
    .toLowerCase()
    .replace(/−/g, '-')
    .replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6')
    .replace(/√/g, 'sqrt')
    .replace(/\s*=\s*/g, '=')
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function evaluateStudentAnswer(userText, expectedAnswer, question) {
  const normUser     = normalizeMathText(userText);
  const normExpected = normalizeMathText(expectedAnswer);

  if (normUser === normExpected) return true;

  // Single-variable: x=N ≡ N (e.g. x=6 ≡ 6, m=−3 ≡ −3)
  const varEqMatch = normExpected.match(/^([a-z])=(-?[\d.]+)$/);
  if (varEqMatch) {
    const numVal = varEqMatch[2];
    if (normUser === numVal || normUser === varEqMatch[1] + '=' + numVal) return true;
  }

  // Multi-variable: match each var=value pair order-independently (e.g. x=3,y=2 or y=2,x=3)
  const varValPairs = [...normExpected.matchAll(/([a-z])=(-?[\d.]+)/g)];
  if (varValPairs.length >= 2) {
    if (varValPairs.every(([, v, n]) => normUser.includes(v + '=' + n))) return true;
  }

  // Conceptual: keyword overlap (40% threshold), single digits included
  if (question.type === 'Conceptual') {
    const keyTokens = expectedAnswer.toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 || /^\d$/.test(t));
    const userLower = userText.toLowerCase();
    const matchCount = keyTokens.filter(t => userLower.includes(t)).length;
    return matchCount >= Math.max(1, Math.floor(keyTokens.length * 0.4));
  }

  // Procedural: keyword overlap on normalized text, single digits included
  const keyTokens = normExpected
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 || /^\d$/.test(t));
  if (keyTokens.length === 0) return false;
  const matchCount = keyTokens.filter(t => normUser.includes(t)).length;
  return matchCount >= Math.max(1, Math.floor(keyTokens.length * 0.4));
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
const loginForm = document.getElementById('loginForm');
if (loginForm && !document.getElementById('stepAccountForm')) {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMsg      = document.getElementById('errorMsg');
  const loginBtn      = document.getElementById('loginBtn');
  const togglePass    = document.getElementById('togglePass');

  if (togglePass) {
    togglePass.addEventListener('click', () => {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = usernameInput.value.trim();
    const pass  = passwordInput.value.trim();
    errorMsg.classList.remove('visible');

    if (!email || !pass) { errorMsg.classList.add('visible'); return; }

    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    onFirebaseReady(async () => {
      try {
        const cred = await window.fbHelpers.signInWithEmailAndPassword(window.fbAuth, email, pass);
        const uref = window.fbHelpers.doc(window.fbDb, 'users', cred.user.uid);
        const snap = await window.fbHelpers.getDoc(uref);
        const profile = snap.exists() ? snap.data() : { fullname: email.split('@')[0] };

        sessionStorage.setItem('edu_logged',    '1');
        sessionStorage.setItem('edu_user',      profile.fullname || email);
        sessionStorage.setItem('edu_email',     email);
        sessionStorage.setItem('edu_uid',       cred.user.uid);
        // Store S from Firestore
        if (profile.S) {
          sessionStorage.setItem('edu_S', JSON.stringify({
            ...profile.S,
            selfLevel: profile.selfLevel || 'mid'
          }));
        }

        setTimeout(() => { window.location.href = 'index.html'; }, 400);
      } catch (err) {
        console.error('[Login]', err.code);
        errorMsg.classList.add('visible');
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
      }
    });
  });
}

/* ============================================================
   MAIN APP PAGE (index.html)
   ============================================================ */
const messagesWrap = document.getElementById('messagesWrap');
if (messagesWrap) {

  if (!sessionStorage.getItem('edu_logged')) {
    window.location.href = 'login.html';
  }

  const storedName   = sessionStorage.getItem('edu_user') || 'Estudiante';
  const storedSRaw   = sessionStorage.getItem('edu_S');
  let   studentS     = storedSRaw
    ? JSON.parse(storedSRaw)
    : { a: 0.5, t: 0.5, f: 0.5, d: 0.5, selfLevel: 'mid' };

  const usedQuestionIds = {}; // por tema: { polinomios: Set, factorizacion: Set, ... }
  let   pendingQuestion = null;
  let   currentTopic    = null;
  let   pendingFeedback = null; // { questionId, topic, resourceLink, sessionId }
  const resourceFeedbackMemory = new Set(); // questionIds marcados "no me sirvió" en la sesión activa

  /* ============================================================
     SISTEMA DE SESIONES Y MÉTRICAS
     Estructura de una sesión activa:
     {
       sessionId       : string   – ID único generado al iniciar
       uid             : string   – UID del estudiante en Firebase
       topic           : string   – clave del tema (ej: 'factorizacion')
       topicLabel      : string   – nombre legible del tema
       startTime       : number   – Date.now() al inicio
       questions       : [        – una entrada por pregunta respondida
         {
           questionId    : string
           difficulty    : 'Easy'|'Medium'|'Hard'
           type          : 'Conceptual'|'Procedural'
           deliveredAt   : number   – Date.now() cuando se entregó
           answeredAt    : number   – Date.now() cuando el alumno respondió
           timeSpentMs   : number   – answeredAt - deliveredAt
           correct       : boolean
           skipped       : boolean  – true si escribió "ver respuesta"
           S_before      : object   – estado S antes de evaluar
           S_after       : object   – estado S después de evaluar
         }
       ]
       S_start         : object   – estado S al inicio de la sesión
     }
     ============================================================ */
  let activeSession = null;

  /* Genera un ID único para cada sesión */
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* Inicia una nueva sesión cuando el estudiante elige un tema */
  function startSession(topic) {
    // Si ya hay una sesión activa de otro tema, cerrarla primero
    if (activeSession && activeSession.topic !== topic) {
      closeSession(false);
    }
    // Si ya hay sesión del mismo tema, continuar en ella
    if (activeSession && activeSession.topic === topic) return;

    activeSession = {
      sessionId  : generateSessionId(),
      uid        : sessionStorage.getItem('edu_uid') || '',
      topic,
      topicLabel : TOPIC_LABELS[topic] || topic,
      startTime      : Date.now(),
      questions      : [],
      S_start        : { ...studentS },
      pilotMode,
      pilotRunId     : PILOT_RUN_ID,
      usefulCount    : 0,
      notUsefulCount : 0,
    };
  }

  /* Registra el momento en que se entregó una pregunta */
  function recordQuestionDelivered(question) {
    if (!activeSession) return;
    activeSession._currentEntry = {
      questionId  : question.id,
      difficulty  : question.difficulty,
      type        : question.type,
      deliveredAt : Date.now(),
      answeredAt  : null,
      timeSpentMs : null,
      correct     : null,
      skipped     : false,
      S_before    : { a: studentS.a, t: studentS.t, f: studentS.f, d: studentS.d },
      S_after     : null,
      pilotMode   : activeSession.pilotMode,
    };
  }

  /* Cierra la entrada actual de pregunta con el resultado */
  function recordQuestionAnswered(correct, skipped = false) {
    if (!activeSession || !activeSession._currentEntry) return;
    const entry = activeSession._currentEntry;
    entry.answeredAt  = Date.now();
    entry.timeSpentMs = entry.answeredAt - entry.deliveredAt;
    entry.correct     = correct;
    entry.skipped     = skipped;
    entry.S_after     = { a: studentS.a, t: studentS.t, f: studentS.f, d: studentS.d };
    activeSession.questions.push(entry);
    activeSession._currentEntry = null;
  }

  /* Calcula las métricas finales de una sesión y genera recomendaciones */
  function computeSessionMetrics(session) {
    const qs = session.questions;
    if (qs.length === 0) return null;

    const totalQuestions  = qs.length;
    const correctCount    = qs.filter(q => q.correct && !q.skipped).length;
    const incorrectCount  = qs.filter(q => !q.correct).length;
    const skippedCount    = qs.filter(q => q.skipped).length;
    const accuracy        = +(correctCount / totalQuestions).toFixed(2);

    const timesMs         = qs.map(q => q.timeSpentMs).filter(t => t != null);
    const totalTimeMs     = Date.now() - session.startTime;
    const avgTimeMs       = timesMs.length ? Math.round(timesMs.reduce((a,b) => a+b, 0) / timesMs.length) : 0;
    const maxTimeMs       = timesMs.length ? Math.max(...timesMs) : 0;
    const minTimeMs       = timesMs.length ? Math.min(...timesMs) : 0;

    // Pregunta en la que más tardó
    const slowestQ = qs.reduce((prev, cur) =>
      (cur.timeSpentMs || 0) > (prev.timeSpentMs || 0) ? cur : prev, qs[0]);

    // Dificultades falladas
    const failedByDiff = { Easy: 0, Medium: 0, Hard: 0 };
    qs.filter(q => !q.correct).forEach(q => {
      if (q.difficulty in failedByDiff) failedByDiff[q.difficulty]++;
    });
    const hardestDiff = Object.entries(failedByDiff)
      .sort((a, b) => b[1] - a[1])
      .find(([, count]) => count > 0);

    // Generar recomendaciones
    const recommendations = [];
    if (accuracy < 0.5) {
      recommendations.push(`📖 Repasa los conceptos básicos de **${session.topicLabel}** antes de continuar.`);
      recommendations.push(`🔗 Recurso recomendado: visita Khan Academy para reforzar fundamentos.`);
    } else if (accuracy < 0.75) {
      recommendations.push(`💪 Buen progreso. Sigue practicando con preguntas de nivel **Medium** en ${session.topicLabel}.`);
    } else {
      recommendations.push(`🏆 ¡Excelente dominio de ${session.topicLabel}! Intenta preguntas de nivel **Hard**.`);
    }
    if (avgTimeMs > 90000) {
      recommendations.push(`⏱️ Estás tardando un promedio de ${Math.round(avgTimeMs/1000)}s por pregunta. Intenta practicar más la velocidad de cálculo.`);
    }
    if (hardestDiff) {
      recommendations.push(`⚠️ Tuviste más errores en preguntas de dificultad **${hardestDiff[0]}**. Enfócate en ese nivel.`);
    }
    if (skippedCount > 0) {
      recommendations.push(`📌 Saltaste ${skippedCount} pregunta(s). Intenta resolverlas antes de ver la respuesta.`);
    }

    // Ruta de aprendizaje sugerida basada en accuracy y errores por dificultad
    const RELATED_TOPIC = {
      polinomios:   'Factorización',
      factorizacion:'Ecuaciones lineales',
      ecuaciones:   'Sistemas de ecuaciones',
      sistemas:     'Fracciones algebraicas',
      fracciones:   'Potencias y radicales',
      potencias:    'Funciones lineales',
      funciones:    'Inecuaciones',
      inecuaciones: 'Potencias y radicales',
    };
    let suggestedPath;
    if (accuracy < 0.5) {
      suggestedPath = `Repasar conceptos básicos de ${session.topicLabel} → resolver preguntas Easy → volver a intentar Medium.`;
    } else if (accuracy < 0.75) {
      suggestedPath = `Practicar más preguntas Medium en ${session.topicLabel} → revisar errores → intentar Hard.`;
    } else {
      const nextTopic = RELATED_TOPIC[session.topic] || 'otro tema de Álgebra';
      suggestedPath = `Continuar con preguntas Hard en ${session.topicLabel} → avanzar a ${nextTopic}.`;
    }

    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracy,
      totalTimeMs,
      avgTimeMs,
      maxTimeMs,
      minTimeMs,
      slowestQuestionId : slowestQ ? slowestQ.questionId : null,
      failedByDifficulty: failedByDiff,
      recommendations,
      suggestedPath,
      S_start        : session.S_start,
      S_end          : { a: studentS.a, t: studentS.t, f: studentS.f, d: studentS.d },
      usefulCount    : session.usefulCount    ?? 0,
      notUsefulCount : session.notUsefulCount ?? 0,
    };
  }

  /* Guarda la sesión completa en Firestore (colección 'sessions') */
  async function saveSessionToFirestore(session, metrics) {
    const uid = session.uid || sessionStorage.getItem('edu_uid');
    if (!uid || !window.fbDb) return;
    onFirebaseReady(async () => {
      try {
        await window.fbHelpers.addDoc(
          window.fbHelpers.collection(window.fbDb, 'sessions'),
          {
            sessionId          : session.sessionId,
            uid,
            topic              : session.topic,
            topicLabel         : session.topicLabel,
            pilotMode          : session.pilotMode,
            pilotRunId         : session.pilotRunId || PILOT_RUN_ID,
            startedAt          : new Date(session.startTime),
            endedAt            : window.fbHelpers.serverTimestamp(),
            totalQuestions     : metrics.totalQuestions,
            correctCount       : metrics.correctCount,
            incorrectCount     : metrics.incorrectCount,
            skippedCount       : metrics.skippedCount,
            accuracy           : metrics.accuracy,
            totalTimeSec       : Math.round(metrics.totalTimeMs / 1000),
            avgTimePerQSec     : Math.round(metrics.avgTimeMs / 1000),
            maxTimePerQSec     : Math.round(metrics.maxTimeMs / 1000),
            minTimePerQSec     : Math.round(metrics.minTimeMs / 1000),
            slowestQuestionId  : metrics.slowestQuestionId,
            failedByDifficulty : metrics.failedByDifficulty,
            recommendations    : metrics.recommendations,
            suggestedPath      : metrics.suggestedPath,
            S_start            : metrics.S_start,
            S_end              : metrics.S_end,
            usefulCount        : metrics.usefulCount,
            notUsefulCount     : metrics.notUsefulCount,
            questions          : session.questions.map(q => ({
              questionId  : q.questionId,
              difficulty  : q.difficulty,
              type        : q.type,
              timeSpentSec: q.timeSpentMs != null ? Math.round(q.timeSpentMs / 1000) : null,
              correct     : q.correct,
              skipped     : q.skipped,
              S_before    : q.S_before,
              S_after     : q.S_after,
            })),
          }
        );
      } catch (e) { console.warn('[saveSession]', e.message); }
    });
  }

  /* Cierra la sesión activa: calcula métricas, guarda en Firestore y muestra resumen */
  function closeSession(showSummary = true) {
    pendingFeedback = null;
    resourceFeedbackMemory.clear();
    if (!activeSession || activeSession.questions.length === 0) {
      activeSession = null;
      return;
    }
    const session = activeSession;
    activeSession = null;
    const metrics = computeSessionMetrics(session);
    if (!metrics) return;

    saveSessionToFirestore(session, metrics);

    if (showSummary) {
      const mins = Math.floor(metrics.totalTimeMs / 60000);
      const secs = Math.round((metrics.totalTimeMs % 60000) / 1000);
      const durationStr = mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;
      const recHtml = metrics.recommendations.map(r => `• ${r}`).join('<br/>');

      const modeLabel = session.pilotMode === 'baseline' ? '📋 Tradicional (baseline)' : '🧠 Adaptativo';
      const feedbackTotal = metrics.usefulCount + metrics.notUsefulCount;
      const feedbackLine  = feedbackTotal > 0
        ? `👍 Recursos útiles: **${metrics.usefulCount}** &nbsp;|&nbsp; 👎 No útiles: **${metrics.notUsefulCount}**<br/>`
        : '';
      const summaryHtml = `
📊 **Resumen de sesión — ${session.topicLabel}**<br/><br/>
🎛️ Modo: **${modeLabel}**<br/>
⏱️ Duración total: **${durationStr}**<br/>
❓ Preguntas respondidas: **${metrics.totalQuestions}**<br/>
✅ Correctas: **${metrics.correctCount}** &nbsp;|&nbsp; ❌ Incorrectas: **${metrics.incorrectCount}** &nbsp;|&nbsp; ⏭️ Saltadas: **${metrics.skippedCount}**<br/>
🎯 Precisión: **${Math.round(metrics.accuracy * 100)}%**<br/>
⌛ Tiempo promedio por pregunta: **${Math.round(metrics.avgTimeMs / 1000)} s**<br/>
${feedbackLine}<br/>
📝 **Recomendaciones:**<br/>${recHtml}<br/><br/>
🗺️ **Ruta sugerida:** ${metrics.suggestedPath}<br/><br/>
_S = [${metrics.S_end.a}, ${metrics.S_end.t}, ${metrics.S_end.f}, ${metrics.S_end.d}] · Sesión guardada en Firestore ✓_`;

      appendMessage(summaryHtml, 'bot');
    }
  }

  /* ── DOM refs ── */
  const chatMessages   = document.getElementById('chatMessages');
  const welcomeScreen  = document.getElementById('welcomeScreen');
  const msgInput       = document.getElementById('msgInput');
  const sendBtn        = document.getElementById('sendBtn');
  const newChatBtn     = document.getElementById('newChatBtn');
  const logoutBtn      = document.getElementById('logoutBtn');
  const menuToggle     = document.getElementById('menuToggle');
  const sidebar        = document.getElementById('sidebar');
  const sidebarClose   = document.getElementById('sidebarClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const topbarSubject  = document.getElementById('topbarSubject');
  const topicChips     = document.querySelectorAll('.topic-chip');

  document.getElementById('userName').textContent    = storedName;
  document.getElementById('welcomeName').textContent = storedName.split(' ')[0];
  document.getElementById('userAvatar').textContent  = getInitial(storedName);

  updateStatePanelUI();

  let chatVisible = false;

  function updateStatePanelUI() {
    const aEl = document.getElementById('stateA');
    const dEl = document.getElementById('stateD');
    const lEl = document.getElementById('stateLevel');
    if (!aEl) return;
    aEl.textContent = studentS.a.toFixed(2);
    dEl.textContent = studentS.d.toFixed(2);
    const lvl = getLevelLabel(studentS);
    lEl.textContent  = lvl.label;
    lEl.style.color  = lvl.color;
  }

  function showChatArea() {
    if (!chatVisible) { welcomeScreen.style.display = 'none'; chatVisible = true; }
  }

  function scrollToBottom() {
    messagesWrap.scrollTo({ top: messagesWrap.scrollHeight, behavior: 'smooth' });
  }

  function appendMessage(html, sender) {
    showChatArea();
    const isUser = sender === 'user';
    const row = document.createElement('div');
    row.className = `msg-row ${isUser ? 'user' : 'bot'}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = `msg-avatar ${isUser ? 'user-av' : 'bot'}`;
    avatarDiv.innerHTML = isUser
      ? getInitial(storedName)
      : `<svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" stroke="#3B82F6" stroke-width="1.5" fill="none"/><circle cx="14" cy="14" r="3" fill="#3B82F6"/></svg>`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = renderText(html);

    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.textContent = isUser ? `Tú · ${formatTime()}` : `EduAdapt AI · ${formatTime()}`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display:flex;flex-direction:column;${isUser ? 'align-items:flex-end' : ''}`;
    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);

    row.appendChild(avatarDiv);
    row.appendChild(wrapper);
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.id = 'typingRow';
    const av = document.createElement('div');
    av.className = 'msg-avatar bot';
    av.innerHTML = `<svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" stroke="#3B82F6" stroke-width="1.5" fill="none"/><circle cx="14" cy="14" r="3" fill="#3B82F6"/></svg>`;
    const bub = document.createElement('div');
    bub.className = 'msg-bubble';
    bub.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    row.appendChild(av);
    row.appendChild(bub);
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function removeTyping() {
    const t = document.getElementById('typingRow');
    if (t) t.remove();
  }

  /* ── Deliver a question from the bank ── */
  function deliverQuestion(topic) {
    if (!usedQuestionIds[topic]) usedQuestionIds[topic] = new Set();
    const modeForQuestion = activeSession ? activeSession.pilotMode : pilotMode;
    const pool = QUESTION_BANK[topic] || [];

    // Si hay preguntas no marcadas como no-útiles disponibles, excluirlas del pool
    const hasAlternatives = pool.some(
      p => !usedQuestionIds[topic].has(p.id) && !resourceFeedbackMemory.has(p.id)
    );
    const avoidSet = hasAlternatives
      ? new Set([...usedQuestionIds[topic], ...resourceFeedbackMemory])
      : usedQuestionIds[topic];
    if (!hasAlternatives && resourceFeedbackMemory.size > 0) {
      appendMessage('⚠️ No quedan recursos alternativos en el banco para este tema. Continuando con la siguiente pregunta disponible.', 'bot');
    }

    const q = pickQuestion(topic, studentS, avoidSet, modeForQuestion);
    if (!q) {
      closeSession(true);
      appendMessage('¡Has repasado todas las preguntas de este tema! 🎉 Selecciona otro tema o escribe una duda específica.', 'bot');
      return;
    }
    usedQuestionIds[topic].add(q.id);
    pendingQuestion = q;
    currentTopic = topic;

    // Registrar el momento de entrega para medir tiempo de respuesta
    recordQuestionDelivered(q);

    const diffEmoji = { Easy: '🟢', Medium: '🟡', Hard: '🔴' };

    const html = `
<strong>[${q.id}]</strong> ${diffEmoji[q.difficulty] || ''} <em>${q.difficulty} · ${q.type}</em><br/><br/>
${q.question}<br/><br/>
<span style="font-size:0.82rem;color:var(--text-muted);">Escribe tu respuesta y la compararé con la solución. También puedes escribir <strong>"ver respuesta"</strong> si quieres verla directamente.</span>`;

    appendMessage(html, 'bot');
  }

  /* ── Evaluate student answer against pending question ── */
  function evaluateAnswer(userText) {
    const q = pendingQuestion;
    pendingQuestion = null;

    // Medir tiempo de respuesta antes de cualquier rama
    const deliveredAt     = activeSession?._currentEntry?.deliveredAt ?? Date.now();
    const responseTimeSec = Math.round((Date.now() - deliveredAt) / 1000);

    const lower = userText.toLowerCase().trim();
    const showDirectly = lower === 'ver respuesta' || lower === 'respuesta' || lower === 'no sé' || lower === 'no se';

    if (showDirectly) {
      studentS = updateS(studentS, false, responseTimeSec);
      persistS();
      updateStatePanelUI();
      const tierLabelSkip = getLevelLabel(studentS).label;
      const justSkip = `_🔍 **¿Por qué este recurso?** Tu nivel actual es **${tierLabelSkip}** (S.a = ${studentS.a}). No resolviste la pregunta de dificultad **${q.difficulty}** en **${TOPIC_LABELS[currentTopic]}** — el recurso te ayudará a cubrir esa brecha antes de continuar._`;
      appendMessage(`La respuesta es:\n\n**${q.answer}**\n\n📚 Recurso de estudio: [${q.id} – ${TOPIC_LABELS[currentTopic]}](${q.link})\n\n${justSkip}`, 'bot');
      recordQuestionAnswered(false, true);
      logInteraction(userText, q, false);
      scheduleFeedbackPrompt(q);
      return;
    }

    const isCorrect = evaluateStudentAnswer(userText, q.answer, q);

    if (isCorrect) {
      studentS = updateS(studentS, true, responseTimeSec);
      persistS();
      updateStatePanelUI();
      const tier = getTier(studentS);
      const tierLabelOk = getLevelLabel(studentS).label;
      const justOk = `_🔍 **¿Por qué este recurso?** Tu nivel actual es **${tierLabelOk}** (S.a = ${studentS.a}). Respondiste correctamente en dificultad **${q.difficulty}** de **${TOPIC_LABELS[currentTopic]}** — el recurso te permite consolidar y profundizar en este concepto._`;
      appendMessage(`✅ **¡Correcto!** Muy bien.\n\nRespuesta esperada: **${q.answer}**\n\n📚 Recurso: [${TOPIC_LABELS[currentTopic]}](${q.link})\n\n${justOk}\n\n_Tier: ${tier} · S = [${studentS.a}, ${studentS.t}, ${studentS.f}, ${studentS.d}]_`, 'bot');
    } else {
      studentS = updateS(studentS, false, responseTimeSec);
      persistS();
      updateStatePanelUI();
      const tierLabelFail = getLevelLabel(studentS).label;
      const justFail = `_🔍 **¿Por qué este recurso?** Tu nivel actual es **${tierLabelFail}** (S.a = ${studentS.a}). Se detectó una brecha en preguntas de dificultad **${q.difficulty}** de **${TOPIC_LABELS[currentTopic]}** — el recurso refuerza exactamente ese concepto._`;
      appendMessage(`❌ **No exactamente.** Aquí está la solución:\n\n**${q.answer}**\n\n📚 Recurso de estudio: [${TOPIC_LABELS[currentTopic]}](${q.link})\n\n${justFail}`, 'bot');
    }

    recordQuestionAnswered(isCorrect, false);
    logInteraction(userText, q, isCorrect);
    scheduleFeedbackPrompt(q);
  }

  function scheduleFeedbackPrompt(q) {
    const snap = {
      questionId   : q.id,
      topic        : currentTopic,
      resourceLink : q.link,
      sessionId    : activeSession ? activeSession.sessionId : null,
    };
    setTimeout(() => {
      pendingFeedback = snap;
      appendMessage('¿El recurso te sirvió? Escribe **"me sirvió"** o **"no me sirvió"**.', 'bot');
    }, 1000);
    setTimeout(() => {
      if (activeSession && activeSession.questions.length >= PILOT_QUESTION_LIMIT) {
        appendMessage(`✅ **Sesión piloto completada** (${PILOT_QUESTION_LIMIT} preguntas respondidas). Guardando resumen...`, 'bot');
        closeSession(true);
      } else {
        offerNextQuestion();
      }
    }, 2400);
  }

  async function logFeedback(useful) {
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid || !window.fbDb || !pendingFeedback) return;
    // Capture snap immediately — pendingFeedback may be nulled by caller before async resolves
    const snap = { ...pendingFeedback };
    try {
      await window.fbHelpers.addDoc(
        window.fbHelpers.collection(window.fbDb, 'feedback'),
        {
          uid,
          sessionId    : snap.sessionId,
          topic        : snap.topic,
          questionId   : snap.questionId,
          resourceLink : snap.resourceLink,
          pilotRunId   : PILOT_RUN_ID,
          useful,
          S_current    : { a: studentS.a, t: studentS.t, f: studentS.f, d: studentS.d },
          createdAt    : window.fbHelpers.serverTimestamp(),
        }
      );
    } catch (e) { console.warn('[logFeedback]', e.message); }
  }

  function offerNextQuestion() {
    appendMessage(`¿Continuamos con **${TOPIC_LABELS[currentTopic]}**? Escribe **"sí"** para otra pregunta, **"cambiar"** para cerrar esta sesión y cambiar de tema, o hazme cualquier pregunta sobre álgebra.`, 'bot');
  }

  /* ── Handle free-text messages ── */
  function detectTopicFromText(msg) {
    const m = msg.toLowerCase();
    if (/polinomio|pol[íi]nom|t[eé]rmino|binomio|trinomio/.test(m)) return 'polinomios';
    if (/factori[sz]|factor\s|factor\b/.test(m)) return 'factorizacion';
    if (/ecuaci[oó]n|despeja|resuelve|resolver|ecuaciones/.test(m)) return 'ecuaciones';
    if (/sistema|sistemas|dos ecuaciones/.test(m)) return 'sistemas';
    if (/fracci[oó]n|racional|denominador|numerador/.test(m)) return 'fracciones';
    if (/potencia|exponente|radical|ra[íi]z|potencias/.test(m)) return 'potencias';
    if (/funci[oó]n|pendiente|linear|lineal|funciones/.test(m)) return 'funciones';
    if (/inecuaci[oó]n|desigualdad|inequalit/.test(m)) return 'inecuaciones';
    return null;
  }

  function handleMessage(text) {
    if (!text.trim()) return;
    appendMessage(text, 'user');
    msgInput.value = '';
    msgInput.style.height = 'auto';
    sendBtn.disabled = true;

    const lower = text.toLowerCase().trim();

    // Feedback de recurso pendiente
    if (pendingFeedback) {
      if (lower === 'me sirvió' || lower === 'me sirvio') {
        if (activeSession) activeSession.usefulCount++;
        logFeedback(true);
        pendingFeedback = null;
        appendMessage('👍 ¡Registrado! Me alegra que el recurso te haya sido útil.', 'bot');
        return;
      }
      if (lower === 'no me sirvió' || lower === 'no me sirvio') {
        if (activeSession) activeSession.notUsefulCount++;
        resourceFeedbackMemory.add(pendingFeedback.questionId);
        logFeedback(false);
        pendingFeedback = null;
        appendMessage('👎 Registrado. Evitaré repetirte ese recurso si hay alternativas disponibles en el banco.', 'bot');
        return;
      }
      // Cualquier otro mensaje descarta el feedback silenciosamente
      pendingFeedback = null;
    }

    // Si hay pregunta pendiente, evaluar la respuesta
    if (pendingQuestion) {
      showTyping();
      setTimeout(() => { removeTyping(); evaluateAnswer(text); }, 700);
      return;
    }

    // Continuar con el tema actual
    if ((lower === 'sí' || lower === 'si' || lower === 'siguiente' || lower === 'otra' || lower === 'otra pregunta') && currentTopic) {
      // Garantizar que existe una sesión activa para que logInteraction siempre tenga sessionId
      if (!activeSession) startSession(currentTopic);
      showTyping();
      setTimeout(() => { removeTyping(); deliverQuestion(currentTopic); }, 700);
      return;
    }

    // Cambiar de tema: cerrar sesión activa con resumen
    if (lower === 'cambiar' || lower === 'otro tema') {
      pendingFeedback = null;
      closeSession(true);
      appendMessage('¡Claro! Selecciona un tema de la barra lateral o escribe el nombre del tema.', 'bot');
      return;
    }

    // Detectar tema por texto libre
    const detectedTopic = detectTopicFromText(lower);
    if (detectedTopic) {
      if (currentTopic && currentTopic !== detectedTopic) closeSession(true);
      currentTopic = detectedTopic;
      startSession(detectedTopic);
      showTyping();
      setTimeout(() => {
        removeTyping();
        appendMessage(`Perfecto, vamos con **${TOPIC_LABELS[detectedTopic]}**. Te enviaré una pregunta adaptada a tu nivel actual (${getLevelLabel(studentS).label}).`, 'bot');
        setTimeout(() => deliverQuestion(detectedTopic), 600);
      }, 700);
      return;
    }

    // Respuesta genérica
    showTyping();
    setTimeout(() => {
      removeTyping();
      const tier = getTier(studentS);
      const generic = [
        `Entiendo tu duda. Para ayudarte mejor, selecciona un tema específico de Álgebra desde la barra lateral o escribe el nombre del tema (ej: "factorización", "ecuaciones"). Tu nivel actual es **${getLevelLabel(studentS).label}**.`,
        `Buena pregunta. Recuerda que puedes practicar con el banco de ejercicios seleccionando cualquier tema del sidebar. Tu estado actual es S = [${studentS.a}, ${studentS.t}, ${studentS.f}, ${studentS.d}].`,
        `Estoy aquí para ayudarte con Álgebra. Dime específicamente qué tema quieres practicar y te envío una pregunta de tu nivel (${tier}).`,
      ];
      appendMessage(generic[Math.floor(Math.random() * generic.length)], 'bot');
    }, 900);
  }

  /* ── Topic chips y sidebar ── */
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const topic = chip.getAttribute('data-topic');
      if (!topic) return;
      if (currentTopic && currentTopic !== topic) closeSession(true);
      currentTopic = topic;
      startSession(topic);
      showChatArea();
      appendMessage(`Quiero practicar: **${TOPIC_LABELS[topic]}**`, 'user');
      showTyping();
      setTimeout(() => {
        removeTyping();
        appendMessage(`¡Vamos con **${TOPIC_LABELS[topic]}**! 🎯 Nivel detectado: ${getLevelLabel(studentS).label}\n\nAquí tienes tu primera pregunta:`, 'bot');
        setTimeout(() => deliverQuestion(topic), 500);
      }, 700);
    });
  });

  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const topic = item.getAttribute('data-topic');
      if (!topic || !QUESTION_BANK[topic]) return;
      pendingQuestion = null;
      pendingFeedback = null;
      if (currentTopic && currentTopic !== topic) closeSession(true);
      currentTopic = topic;
      startSession(topic);
      chatMessages.innerHTML = '';
      chatVisible = false;
      showChatArea();
      topbarSubject.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> ${TOPIC_LABELS[topic]}`;
      appendMessage(`Comenzamos con **${TOPIC_LABELS[topic]}**. Nivel: ${getLevelLabel(studentS).label}`, 'bot');
      setTimeout(() => deliverQuestion(topic), 600);
      closeSidebar();
    });
  });

  /* ── Input handlers ── */
  msgInput.addEventListener('input', () => {
    sendBtn.disabled = msgInput.value.trim() === '';
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 160) + 'px';
  });
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleMessage(msgInput.value.trim());
    }
  });
  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) handleMessage(msgInput.value.trim());
  });

  newChatBtn.addEventListener('click', () => {
    closeSession(true);
    chatMessages.innerHTML = '';
    welcomeScreen.style.display = '';
    chatVisible = false;
    pendingQuestion = null;
    currentTopic = null;
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    topbarSubject.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Álgebra`;
    closeSidebar();
  });

  logoutBtn.addEventListener('click', async () => {
    closeSession(false); // cerrar sesión silenciosamente al salir
    try { if (window.fbAuth) await window.fbHelpers.signOut(window.fbAuth); } catch {}
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  // Recuperar sesión que quedó pendiente por cierre inesperado de pestaña
  onFirebaseReady(() => {
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid) return;
    const pendingKey = `edu_pending_session_${uid}`;
    const raw = localStorage.getItem(pendingKey);
    if (!raw) return;
    localStorage.removeItem(pendingKey); // eliminar antes de guardar para evitar doble escritura
    try {
      const { session, metrics } = JSON.parse(raw);
      if (session && metrics) {
        saveSessionToFirestore(session, metrics);
        console.info('[Recovery] Sesión pendiente recuperada y guardada:', session.sessionId);
      }
    } catch (_) {}
  });

  // Persistir sesión activa en localStorage como fallback ante cierre de pestaña
  window.addEventListener('beforeunload', () => {
    if (activeSession && activeSession.questions.length > 0) {
      const metrics = computeSessionMetrics(activeSession);
      if (metrics) {
        const uid = activeSession.uid || sessionStorage.getItem('edu_uid') || 'anon';
        try {
          localStorage.setItem(
            `edu_pending_session_${uid}`,
            JSON.stringify({
              session: {
                sessionId : activeSession.sessionId,
                uid       : activeSession.uid,
                topic     : activeSession.topic,
                topicLabel: activeSession.topicLabel,
                pilotMode : activeSession.pilotMode,
                startTime : activeSession.startTime,
                questions : activeSession.questions,
              },
              metrics,
            })
          );
        } catch (_) { /* localStorage lleno o no disponible */ }
      }
    }
    closeSession(false);
  });

  function openSidebar()  { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  menuToggle.addEventListener('click', openSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  /* ── Pilot mode toggle ── */
  const btnAdaptive = document.getElementById('btnAdaptive');
  const btnBaseline = document.getElementById('btnBaseline');

  function updatePilotToggleUI() {
    const isAdaptive = pilotMode === 'adaptive';
    btnAdaptive.style.background = isAdaptive ? 'var(--blue)' : 'transparent';
    btnAdaptive.style.color      = isAdaptive ? '#fff' : 'var(--text-muted)';
    btnBaseline.style.background = isAdaptive ? 'transparent' : 'var(--blue)';
    btnBaseline.style.color      = isAdaptive ? 'var(--text-muted)' : '#fff';
  }

  btnAdaptive.addEventListener('click', () => {
    if (pilotMode === 'adaptive') return;
    // Cerrar la sesión activa siempre: con resumen si tiene preguntas, sin resumen si está vacía
    if (activeSession) closeSession(activeSession.questions.length > 0);
    pilotMode = 'adaptive';
    updatePilotToggleUI();
    appendMessage('🧠 Modo cambiado a **Adaptativo**. La próxima sesión usará preguntas adaptadas a tu estado S.', 'bot');
  });
  btnBaseline.addEventListener('click', () => {
    if (pilotMode === 'baseline') return;
    if (activeSession) closeSession(activeSession.questions.length > 0);
    pilotMode = 'baseline';
    updatePilotToggleUI();
    appendMessage('📋 Modo cambiado a **Tradicional** (baseline). Las preguntas seguirán el orden fijo del banco.', 'bot');
  });

  /* ── Persist S to sessionStorage + Firestore ── */
  function persistS() {
    sessionStorage.setItem('edu_S', JSON.stringify(studentS));
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid || !window.fbDb) return;
    onFirebaseReady(async () => {
      try {
        await window.fbHelpers.setDoc(
          window.fbHelpers.doc(window.fbDb, 'users', uid),
          { S: { a: studentS.a, t: studentS.t, f: studentS.f, d: studentS.d } },
          { merge: true }
        );
      } catch (e) { console.warn('[persistS]', e.message); }
    });
  }

  /* ── Log de interacción individual en Firestore (colección 'interactions') ── */
  async function logInteraction(userMsg, question, correct) {
    const uid = sessionStorage.getItem('edu_uid');
    if (!uid || !window.fbDb) return;
    // sessionId is always sourced from activeSession; if session closed before this async call
    // resolves, we capture it early at call time (callers pass sessionId explicitly when needed)
    const sessionId = activeSession ? activeSession.sessionId : null;
    if (!sessionId) { console.warn('[logInteraction] llamado sin sesión activa'); }
    try {
      await window.fbHelpers.addDoc(
        window.fbHelpers.collection(window.fbDb, 'interactions'),
        {
          uid,
          sessionId,
          topic      : currentTopic,
          questionId : question.id,
          difficulty : question.difficulty,
          type       : question.type,
          pilotMode  : activeSession ? activeSession.pilotMode : pilotMode,
          pilotRunId : PILOT_RUN_ID,
          userMsg,
          correct,
          S_after    : { a: studentS.a, t: studentS.t, f: studentS.f, d: studentS.d },
          createdAt  : window.fbHelpers.serverTimestamp(),
        }
      );
    } catch (e) { console.warn('[logInteraction]', e.message); }
  }
}

/* ============================================================
   REGISTER / DIAGNOSTIC PAGE
   ============================================================ */
const regStep1 = document.getElementById('stepAccountForm');
if (regStep1) {

  const regState = {
    fullname: '', email: '', password: '',
    selfLevel: null, preferences: [], studyTime: null, quizAnswers: [],
  };

  const QUIZ_QUESTIONS = [
    { difficulty:1, question:'Resuelve para x: <code>2x + 6 = 14</code>',
      options:['x = 2','x = 4','x = 6','x = 10'], correct:1 },
    { difficulty:1, question:'Simplifica: <code>3a + 5a − 2a</code>',
      options:['6a','7a','5a','10a'], correct:0 },
    { difficulty:1, question:'Evalúa si <code>x = 3</code>: <code>x² − 2x + 1</code>',
      options:['2','4','6','8'], correct:1 },
    { difficulty:1, question:'Factoriza: <code>x² − 9</code>',
      options:['(x−3)²','(x+3)(x−3)','(x−9)(x+1)','No se puede'], correct:1 },
    { difficulty:2, question:'Resuelve: <code>x² − 5x + 6 = 0</code>',
      options:['x=1, x=6','x=2, x=3','x=−2, x=−3','x=0, x=5'], correct:1 },
    { difficulty:2, question:'Resuelve el sistema: <code>x + y = 7</code>, <code>x − y = 1</code>',
      options:['x=3, y=4','x=4, y=3','x=5, y=2','x=2, y=5'], correct:1 },
    { difficulty:2, question:'Simplifica: <code>(x² · x³) / x⁴</code>',
      options:['x','x²','x⁵','1/x'], correct:0 },
    { difficulty:2, question:'Racionaliza: <code>1 / √2</code>',
      options:['√2','√2 / 2','2 / √2','1 / 2'], correct:1 },
  ];

  function gotoStep(n) {
    document.querySelectorAll('.register-step').forEach(p => p.classList.remove('active'));
    const panel = document.querySelector(`[data-step-panel="${n}"]`);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.step-dot').forEach(d => {
      const s = parseInt(d.dataset.step);
      d.classList.remove('active','done');
      if (s === n) d.classList.add('active');
      else if (s < n) d.classList.add('done');
    });
    document.querySelectorAll('.step-line').forEach((l, i) => l.classList.toggle('done', i+1 < n));
    document.querySelectorAll('.step-label').forEach((l, i) => l.classList.toggle('active', i+1 === n));
  }

  regStep1.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullname = document.getElementById('regFullname').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errBox   = document.getElementById('accountError');
    const errText  = document.getElementById('accountErrorText');
    errBox.classList.remove('visible');

    if (!fullname || !email || !password) { errText.textContent='Completa todos los campos'; errBox.classList.add('visible'); return; }
    if (password.length < 6)             { errText.textContent='Contraseña mínimo 6 caracteres'; errBox.classList.add('visible'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email))  { errText.textContent='Correo no válido'; errBox.classList.add('visible'); return; }

    regState.fullname = fullname;
    regState.email    = email;
    regState.password = password;
    gotoStep(2);
  });

  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      regState.selfLevel = card.dataset.level;
      document.getElementById('next2').disabled = false;
    });
  });
  document.getElementById('back2').addEventListener('click', () => gotoStep(1));
  document.getElementById('next2').addEventListener('click', () => { if (regState.selfLevel) gotoStep(3); });

  function checkStep3() {
    const hasPrefs = document.querySelectorAll('.pref-check:checked').length > 0;
    const hasTime  = document.querySelector('input[name="time"]:checked') !== null;
    document.getElementById('next3').disabled = !(hasPrefs && hasTime);
  }
  document.querySelectorAll('.pref-check').forEach(c => c.addEventListener('change', checkStep3));
  document.querySelectorAll('input[name="time"]').forEach(r => r.addEventListener('change', checkStep3));
  document.getElementById('back3').addEventListener('click', () => gotoStep(2));
  document.getElementById('next3').addEventListener('click', () => {
    regState.preferences = Array.from(document.querySelectorAll('.pref-check:checked')).map(c => c.value);
    regState.studyTime   = document.querySelector('input[name="time"]:checked').value;
    renderQuiz();
    gotoStep(4);
  });

  function renderQuiz() {
    regState.quizAnswers = Array(QUIZ_QUESTIONS.length).fill(null);
    showQuizQuestion(0);
  }

  let currentQuiz = 0;
  function showQuizQuestion(idx) {
    currentQuiz = idx;
    const q = QUIZ_QUESTIONS[idx];
    const container = document.getElementById('quizContainer');
    container.innerHTML = `<div class="quiz-question">${q.question}</div><div class="quiz-options" id="quizOpts"></div>`;
    const opts = document.getElementById('quizOpts');
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'quiz-option';
      div.textContent = opt;
      if (regState.quizAnswers[idx] === i) div.classList.add('selected');
      div.addEventListener('click', () => {
        opts.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        div.classList.add('selected');
        regState.quizAnswers[idx] = i;
        setTimeout(() => {
          if (idx < QUIZ_QUESTIONS.length - 1) {
            showQuizQuestion(idx + 1);
            updateQuizProgress(idx + 1);
          } else {
            updateQuizProgress(QUIZ_QUESTIONS.length);
            document.getElementById('submitQuiz').disabled = false;
          }
        }, 250);
      });
      opts.appendChild(div);
    });
  }

  function updateQuizProgress(answeredCount) {
    document.getElementById('quizCounter').textContent =
      `Pregunta ${Math.min(answeredCount+1, QUIZ_QUESTIONS.length)} / ${QUIZ_QUESTIONS.length}`;
    document.getElementById('quizBarFill').style.width =
      Math.max(12.5, (answeredCount/QUIZ_QUESTIONS.length)*100) + '%';
  }

  document.getElementById('back4').addEventListener('click', () => gotoStep(3));

  function computeStudentState(r) {
    let correct = 0;
    r.quizAnswers.forEach((ans, i) => { if (ans === QUIZ_QUESTIONS[i].correct) correct++; });
    const a = correct / QUIZ_QUESTIONS.length;
    const selfMap = { low:0.3, mid:0.6, high:0.9 };
    const d = +(0.4 * selfMap[r.selfLevel] + 0.6 * a).toFixed(2);
    return { a:+a.toFixed(2), t:0.5, f:0.5, d };
  }

  document.getElementById('submitQuiz').addEventListener('click', () => {
    const btn = document.getElementById('submitQuiz');
    btn.classList.add('loading');
    btn.disabled = true;

    onFirebaseReady(async () => {
      const S = computeStudentState(regState);
      try {
        const cred = await window.fbHelpers.createUserWithEmailAndPassword(
          window.fbAuth, regState.email, regState.password
        );
        const uid = cred.user.uid;

        const userDoc = {
          uid, fullname:regState.fullname, email:regState.email,
          selfLevel:regState.selfLevel, preferences:regState.preferences,
          studyTime:regState.studyTime, quizAnswers:regState.quizAnswers,
          quizCorrect: regState.quizAnswers.filter((a,i) => a===QUIZ_QUESTIONS[i].correct).length,
          quizTotal: QUIZ_QUESTIONS.length,
          S, createdAt: window.fbHelpers.serverTimestamp(),
        };
        await window.fbHelpers.setDoc(window.fbHelpers.doc(window.fbDb,'users',uid), userDoc);

        sessionStorage.setItem('edu_logged','1');
        sessionStorage.setItem('edu_user', regState.fullname);
        sessionStorage.setItem('edu_email', regState.email);
        sessionStorage.setItem('edu_uid',  uid);
        sessionStorage.setItem('edu_S',    JSON.stringify({ ...S, selfLevel: regState.selfLevel }));

        renderResultSummary({ ...regState, S });
        gotoStep(5);
        document.querySelectorAll('.step-dot').forEach(d => d.classList.add('done'));
        document.querySelectorAll('.step-line').forEach(l => l.classList.add('done'));
      } catch (err) {
        console.error('[Register]', err.code);
        let msg = 'Error al registrar';
        if (err.code==='auth/email-already-in-use') msg='Ese correo ya está registrado';
        else if (err.code==='auth/invalid-email')   msg='Correo inválido';
        else if (err.code==='auth/weak-password')   msg='Contraseña muy débil';
        gotoStep(1);
        const errBox  = document.getElementById('accountError');
        const errText = document.getElementById('accountErrorText');
        errText.textContent = msg;
        errBox.classList.add('visible');
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  });

  function renderResultSummary(user) {
    const S = user.S;
    const correct = user.quizAnswers.filter((a,i) => a===QUIZ_QUESTIONS[i].correct).length;
    const total   = QUIZ_QUESTIONS.length;
    let levelCat, levelClass;
    if (S.d >= 0.7)       { levelCat='Avanzado';   levelClass='high'; }
    else if (S.d >= 0.45) { levelCat='Intermedio'; levelClass='mid';  }
    else                  { levelCat='Básico';     levelClass='low';  }

    const prefLabels = { formulas:'Fórmulas', text:'Texto', video:'Videos', exercises:'Ejercicios', examples:'Ejemplos' };
    const timeLabels = { 'lt2':'< 2 h/semana', '2-5':'2–5 h/semana', '5-10':'5–10 h/semana', 'gt10':'> 10 h/semana' };

    document.getElementById('stateSummary').innerHTML = `
      <div class="state-row"><span class="state-key">Quiz diagnóstico</span><span class="state-value">${correct} / ${total}</span></div>
      <div class="state-row"><span class="state-key">Nivel detectado</span><span class="state-value ${levelClass}">${levelCat}</span></div>
      <div class="state-row"><span class="state-key">S = [a, t, f, d]</span><span class="state-value">[${S.a}, ${S.t}, ${S.f}, ${S.d}]</span></div>
      <div class="state-row"><span class="state-key">Preferencias</span><span class="state-value" style="font-size:0.8rem">${user.preferences.map(p=>prefLabels[p]).join(', ')}</span></div>
      <div class="state-row"><span class="state-key">Tiempo disponible</span><span class="state-value" style="font-size:0.8rem">${timeLabels[user.studyTime]}</span></div>
      <div class="state-row"><span class="state-key">Almacenamiento</span><span class="state-value high" style="font-size:0.8rem">✓ Guardado en Firebase</span></div>
    `;
  }

  document.getElementById('goToApp').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

/* ============================================================
   SELF-TESTS — run in browser console: window.runEduAdaptSelfTests()
   ============================================================ */
window.runEduAdaptSelfTests = function () {
  const results = [];
  function test(name, got, expected) {
    const ok = String(got) === String(expected);
    results.push({ name, ok, got, expected });
    if (ok) console.info(`[PASS] ${name}`);
    else    console.warn(`[FAIL] ${name}: got "${got}", expected "${expected}"`);
  }

  const P = { type: 'Procedural' };
  const C = { type: 'Conceptual' };

  // normalizeMathText
  test('norm: unicode minus',   normalizeMathText('x−3'),    'x-3');
  test('norm: superscript 2',   normalizeMathText('x²'),     'x^2');
  test('norm: superscript 3',   normalizeMathText('x³'),     'x^3');
  test('norm: superscript 0',   normalizeMathText('x⁰'),     'x^0');
  test('norm: superscript 1',   normalizeMathText('x¹'),     'x^1');
  test('norm: sqrt symbol',     normalizeMathText('√9'),     'sqrt9');
  test('norm: spaces around =', normalizeMathText('x = 6'),  'x=6');
  test('norm: spaces around +', normalizeMathText('a + b'),  'a+b');

  // evaluateStudentAnswer — exact match
  test('eval: exact normalized', evaluateStudentAnswer('8x²−5x', '8x²−5x', P), true);

  // evaluateStudentAnswer — single-variable equivalence
  test('eval: x=6 → 6',         evaluateStudentAnswer('6',     'x = 6', P), true);
  test('eval: x=6 → x=6',       evaluateStudentAnswer('x = 6','x = 6', P), true);
  test('eval: m=−3 → −3',       evaluateStudentAnswer('-3',    'm = −3', P), true);

  // evaluateStudentAnswer — multi-variable (order-independent)
  test('eval: x=3,y=2 exact',    evaluateStudentAnswer('x = 3, y = 2', 'x = 3, y = 2', P), true);
  test('eval: x=3,y=2 reversed', evaluateStudentAnswer('y = 2, x = 3', 'x = 3, y = 2', P), true);
  test('eval: x=2,y=3 systems',  evaluateStudentAnswer('x = 2, y = 3', 'x = 2, y = 3', P), true);

  // evaluateStudentAnswer — procedural single-digit tokens (regression for filter bug)
  test('eval: x^3 answer',       evaluateStudentAnswer('x^3', 'x³', P), true);
  test('eval: x^5 answer',       evaluateStudentAnswer('x^5', 'x⁵', P), true);

  // evaluateStudentAnswer — conceptual keyword match
  test('eval: conceptual partial',
    evaluateStudentAnswer('producto de factores', 'Reescribir una expresión como un producto de factores; es la operación inversa de multiplicar.', C), true);

  // evaluateStudentAnswer — wrong answers
  test('eval: wrong single-var',  evaluateStudentAnswer('x = 5', 'x = 6', P), false);
  test('eval: wrong multi-var',   evaluateStudentAnswer('x = 1, y = 4', 'x = 3, y = 2', P), false);

  // updateS
  const S0 = { a: 0.5, t: 0.5, f: 0.0, d: 0.5, selfLevel: 'mid' };
  const S1 = updateS(S0, true,  30);
  const S2 = updateS(S0, false, 30);
  test('updateS: a increases on correct', S1.a > S0.a, true);
  test('updateS: a decreases on wrong',   S2.a < S0.a, true);
  test('updateS: f increments',           S1.f > S0.f, true);
  test('updateS: f max 1.0',              updateS({ ...S0, f: 1.0 }, true, 30).f, 1);

  // PILOT_QUESTION_LIMIT constant
  test('PILOT_QUESTION_LIMIT is 5', PILOT_QUESTION_LIMIT, 5);

  const passed = results.filter(r => r.ok).length;
  console.info(`\n[EduAdapt Self-Tests] ${passed}/${results.length} passed`);
  return results;
};
