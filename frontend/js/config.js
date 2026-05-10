/* ============================================================
   EduAdapt AI – config.js
   Configuración global de la aplicación
   ============================================================ */

export const CONFIG = {
  // Backend API
  API_BASE_URL: 'http://localhost:5000',   

  // Firebase
  FIREBASE_READY_EVENT: 'firebase-ready',

  // Modo piloto por defecto
  DEFAULT_MODE: 'adaptive',               // 'adaptive' | 'baseline'

  // Límite de preguntas por sesión en el piloto
  PILOT_QUESTION_LIMIT: 5,
  PILOT_RUN_ID: 'pilot_final_2026_05',

  // Tópicos disponibles
  TOPICS: [
    'polinomios', 'factorizacion', 'ecuaciones', 'sistemas',
    'fracciones', 'potencias', 'funciones', 'inecuaciones'
  ],

  TOPIC_LABELS: {
    polinomios:   'Operaciones con polinomios',
    factorizacion:'Factorización',
    ecuaciones:   'Ecuaciones lineales',
    sistemas:     'Sistemas de ecuaciones',
    fracciones:   'Fracciones algebraicas',
    potencias:    'Potencias y radicales',
    funciones:    'Funciones lineales',
    inecuaciones: 'Inecuaciones'
  }
};