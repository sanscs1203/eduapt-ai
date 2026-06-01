/* ============================================================
   EduAdapt AI – config.js
   Configuración global de la aplicación (frontend)
   ============================================================ */

/**
 * Objeto de configuración principal que agrupa todas las constantes
 * utilizadas por el frontend del tutor de álgebra.
 * Las propiedades son inmutables y deben ser definidas antes del inicio.
 */
export const CONFIG = {
  // ==========================================================================
  // Configuración del backend (API)
  // ==========================================================================

  /** @type {string} URL base de la API REST del backend (Flask) */
  API_BASE_URL: 'http://127.0.0.1:5000',

  // ==========================================================================
  // Configuración de Firebase (autenticación y eventos)
  // ==========================================================================

  /**
   * Nombre del evento personalizado que se dispara cuando Firebase
   * ha terminado de inicializarse.
   * @type {string}
   */
  FIREBASE_READY_EVENT: 'firebase-ready',

  // ==========================================================================
  // Modos de práctica y sesión
  // ==========================================================================

  /**
   * Modo por defecto para las sesiones de práctica.
   * - 'adaptive': selección adaptativa de preguntas según el modelo del estudiante.
   * - 'baseline': selección aleatoria de preguntas (grupo de control).
   * @type {string}
   */
  DEFAULT_MODE: 'adaptive',

  /**
   * Número máximo de preguntas por sesión en el experimento piloto.
   * @type {number}
   */
  PILOT_QUESTION_LIMIT: 5,

  /** Identificador fijo de la ejecución del piloto (para análisis de datos). */
  PILOT_RUN_ID: 'pilot_final_2026_05',

  // ==========================================================================
  // Datos del banco de preguntas
  // ==========================================================================

  /** Ruta (relativa al frontend) del archivo JSON con las preguntas. */
  QUESTION_BANK_PATH: 'data/algebra_questions.json',

  // ==========================================================================
  // Listado de temas (10 temas, claves exactas del backend)
  // ==========================================================================

  /**
   * Array con los identificadores de los temas que maneja el tutor.
   * Deben coincidir con los valores usados por el backend (app.py).
   * @type {string[]}
   */
  TOPICS: [
    'polinomios',
    'factorizacion',
    'ecuaciones',
    'sistemas',
    'fracciones',
    'potencias',
    'radicales',
    'logaritmos',
    'funciones',
    'inecuaciones'
  ],

  // ==========================================================================
  // Etiquetas amigables para la interfaz de usuario (UI)
  // ==========================================================================

  /**
   * Mapa entre los identificadores internos de los temas y las etiquetas
   * que se muestran en la barra lateral y en los mensajes del chat.
   * @type {Object.<string, string>}
   */
  TOPIC_LABELS: {
    polinomios:    '📐 Polinomios',
    factorizacion: '🔢 Factorización',
    ecuaciones:    '⚖️ Ecuaciones',
    sistemas:      '🔗 Sistemas de ecuaciones',
    fracciones:    '➗ Fracciones algebraicas',
    potencias:     '⚡ Potencias',
    radicales:     '√ Radicales',
    logaritmos:    '📈 Logaritmos',
    funciones:     '📊 Funciones',
    inecuaciones:  '📉 Inecuaciones'
  }
};