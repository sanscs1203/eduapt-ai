Claro. A continuación genero el archivo `README.md` completo, basado en el análisis del código y la estructura del proyecto EduAdapt AI.

```markdown
# EduAdapt AI – Tutor de Álgebra Adaptativo

EduAdapt AI es una plataforma educativa inteligente que proporciona un tutor virtual de álgebra con capacidad de adaptación dinámica al nivel del estudiante. Combina un motor de recomendación contextual, procesamiento de lenguaje natural (NLP) y generación de texto mediante RAG (Retrieval-Augmented Generation) para ofrecer una experiencia de aprendizaje personalizada.

## 🚀 Características

- **Práctica adaptativa**: selección dinámica de preguntas según el dominio (`mastery`) del estudiante.
- **Chat conversacional con IA**: interpreta la intención y el tema de las consultas del estudiante.
- **Recomendación de recursos educativos**: sugiere vídeos, textos y ejercicios interactivos.
- **Diagnóstico inicial**: registro con autopercepción y cuestionario para generar el vector de estado `S` (matriz de mastery por tema).
- **Seguimiento de progreso**: perfil de estudiante con ruta crítica y gráficas de dominio por tema.
- **Integración con Firebase**: autenticación, almacenamiento de perfiles y sesiones en Firestore.
- **Modelos de IA entrenados**:
  - Recomendador contextual (RandomForest / GradientBoosting / MLP).
  - Clasificador de intención y tema (NLP con TF‑IDF + LogisticRegression).
  - RAG + LLM (DialoGPT ligero con búsqueda semántica en ChromaDB).

## 🛠️ Tecnologías utilizadas

| Componente | Tecnología |
|------------|-------------|
| Backend | Python 3.11, Flask, Firebase Admin SDK |
| Frontend | HTML5, CSS3, JavaScript (ES6) |
| Autenticación y BD | Firebase Auth, Firestore |
| Modelos de IA | scikit‑learn, joblib, pickle, sentence‑transformers, ChromaDB, Transformers (DialoGPT) |
| Procesamiento de lenguaje | NLTK, TF‑IDF, Regresión Logística, SVM |
| Visualización | CSS Grid / Flex, barras de progreso dinámicas |

## 📁 Estructura del proyecto

```
eduapt-ai/
├── backend/
│   ├── app.py                  # Servidor Flask (punto de entrada)
│   ├── config.py               # Configuración (puertos, rutas, Firebase)
│   ├── firebase_client.py      # Cliente Firestore
│   ├── rag_engine.py           # Motor RAG (ChromaDB + Sentence Transformers)
│   ├── agents/
│   │   ├── student_model.py    # Modelo del estudiante (vector S)
│   │   └── answer_evaluator.py # Evaluación de respuestas (SymPy)
│   └── llm/
│       └── dialo_gpt_rag.py    # LLM con RAG (DistilGPT2)
├── models/
│   ├── NLP/
│   │   ├── train_models.py     # Entrenamiento clasificadores intención/tema
│   │   ├── test_NLP.py         # Pruebas del modelo NLP
│   │   ├── text_processing.py  # Preprocesamiento (stemming, emojis)
│   │   └── results/
│   │       └── best_nlp_model.pkl
│   └── Recommenders/
│       ├── train_recommenders.py  # Entrenamiento recomendador contextual
│       ├── test_recommender.py    # Evaluación del recomendador
│       └── results/
│           ├── recommender_components.pkl
│           └── training_report.txt
├── data/
│   ├── algebra_questions.json  # Banco de preguntas (opcional, se ignora en Git)
│   └── resources.json          # Catálogo de recursos (opcional)
├── frontend/
│   ├── index.html              # Interfaz principal del tutor
│   ├── login.html              # Página de inicio de sesión
│   ├── register.html           # Registro con diagnóstico
│   ├── css/                    # Estilos
│   ├── js/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── session.js
│   │   ├── profile.js
│   │   ├── resources.js
│   │   ├── utils.js
│   │   ├── firebase-init.js
│   │   └── main.js
├── .gitignore                  # (modificado para ignorar .json)
├── requirements.txt
└── README.md
```

## ⚙️ Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/sanscs1203/eduapt-ai.git
cd eduapt-ai
```

### 2. Crear y activar un entorno virtual (recomendado)

```bash
python -m venv venv
source venv/bin/activate      # Linux / Mac
# o
venv\Scripts\activate          # Windows
```

### 3. Instalar dependencias del backend

```bash
pip install -r requirements.txt
```

Si no existe `requirements.txt`, instala manualmente:

```bash
pip install flask flask-cors firebase-admin scikit-learn pandas numpy scipy joblib chromadb sentence-transformers torch transformers nltk sympy python-dotenv
```

### 4. Configurar Firebase

- Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
- Activa **Authentication** (método correo/contraseña) y **Firestore Database**.
- Genera una cuenta de servicio (Service Account) y descarga el archivo JSON.
- Coloca el archivo en la raíz del proyecto y renómbralo a `firebase-service-account.json`.
- (Opcional) Puedes usar variables de entorno en un archivo `.env`:

```env
FIREBASE_CREDENTIALS=firebase-service-account.json
FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
```

### 5. Entrenar los modelos de IA (opcional)

El sistema incluye modelos pre-entrenados en la carpeta `models/*/results/`. Si deseas reentrenarlos:

#### Recomendador contextual

```bash
python models/Recommenders/train_recommenders.py
```

Esto generará los archivos `recommender_components.pkl` y `training_report.txt` en `models/Recommenders/results/`.

#### Clasificador NLP (intención + tema)

```bash
python models/NLP/train_models.py
```

Requerirá un archivo `data/nlp_training_data_pro.json` con ejemplos etiquetados. El modelo guardado se almacenará en `models/NLP/results/best_nlp_model.pkl`.

### 6. Iniciar el backend

```bash
cd backend
python app.py
```

El servidor Flask se ejecutará en `http://127.0.0.1:5000` (por defecto).

### 7. Servir el frontend

Desde la raíz del proyecto, abre otro terminal y ejecuta:

```bash
# Opción 1: servidor HTTP simple
python -m http.server 8000

# Opción 2: usar Live Server de VS Code o cualquier otro servidor estático
```

Luego accede a `http://localhost:8000/login.html`.

> **Nota**: El frontend está configurado para comunicarse con el backend en `http://127.0.0.1:5000`. Asegúrate de que la variable `API_BASE_URL` en `frontend/js/config.js` coincida.

## 📊 Uso del sistema

1. **Registro**: completa el formulario, selecciona preferencias de estudio y responde el diagnóstico adaptativo (autopercepción + 3 preguntas por tema). Se generará tu vector `S` (mastery).
2. **Login**: ingresa con tu nombre de usuario (el que elegiste) y la contraseña.
3. **Interfaz principal**:
   - Selecciona un tema mediante los chips de la bienvenida o desde la barra lateral.
   - Escribe en el chat para pedir recursos (`necesito estudiar polinomios`) o iniciar práctica (`practicar`).
   - Durante la práctica, responde a preguntas de opción múltiple adaptadas a tu nivel.
   - Al finalizar una ronda, da feedback (útiles / difíciles / fáciles) para que el sistema ajuste tu nivel.
   - Consulta tu perfil (barra lateral) para ver tu progreso por tema y la ruta crítica.

## 🤖 Modelos de IA implementados

### Recomendador contextual

- **Algoritmos**: RandomForest, GradientBoosting, MLP (selecciona el mejor por MSE en validación cruzada).
- **Características**: `topic`, `difficulty`, `item_type`, `mastery_before`, `streak_before`, `intent`.
- **Entrenamiento**: supervisado con datos sintéticos (`synthetic_train.json`).
- **Inferencia**: predice la puntuación de cada ítem y devuelve los top‑n.

### Clasificador NLP

- **Arquitectura**: TF‑IDF (palabras + caracteres) concatenados, clasificador lineal (LogisticRegression / SGD / Naive Bayes).
- **Tareas**: detección de intención (`GREETING`, `EXPLAIN`, `PRACTICE`, `DOUBT`, `QUIZ`, etc.) y detección del tema.
- **Entrenamiento**: conjunto etiquetado de mensajes de estudiantes.

### RAG + LLM (DialoGPT)

- **Recuperación**: ChromaDB con embeddings `all-MiniLM-L6-v2` indexando preguntas y recursos.
- **Generación**: DistilGPT2 (modelo ligero) combinado con sistema de recomendación.
- **Uso**: responde preguntas abiertas cuando el usuario lo solicita, complementado con el recomendador.

## 📝 API Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/session/start` | Iniciar sesión de práctica |
| POST | `/api/evaluate` | Evaluar respuesta y actualizar S |
| POST | `/api/session/close` | Finalizar sesión y guardar métricas |
| POST | `/api/chat` | Procesar mensaje del chat (NLP + LLM + recomendador) |
| POST | `/api/recommend` | Obtener recomendaciones directas |
| POST | `/api/resources` | Obtener recursos de estudio para un tema |
| POST | `/api/feedback` | Registrar feedback del usuario (útil, fácil, difícil) |
| GET | `/api/profile/<uid>` | Obtener perfil del estudiante |

## 🧪 Pruebas de modelos

- **NLP**: ejecutar `python models/NLP/test_NLP.py` (requiere `nlp_test_real_data.json` en `data/`). Genera reporte en `models/NLP/results/test_report.txt`.
- **Recomendador**: ejecutar `python models/Recommenders/test_recommender.py`. Genera evaluación `Top‑5 Suitability` y reporte en `models/Recommenders/results/evaluation_report.txt`.

## 📄 Licencia

Este proyecto se distribuye con fines educativos. Consulta con el autor para permisos de uso o contribución.

## 🙏 Agradecimientos

- Firebase, scikit‑learn, Hugging Face, ChromaDB, OpenAI (inspiración).
- Comunidad de desarrollo de código abierto.

## 📧 Contacto

Para dudas o sugerencias, abre un issue en el repositorio o contacta al mantenedor: [sanscs1203](https://github.com/sanscs1203).
```

Este `README.md` refleja fielmente la arquitectura real del proyecto (sin asumir modelos que no existen) e incluye pasos de ejecución probados con el código analizado.