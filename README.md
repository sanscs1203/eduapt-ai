# EduAdapt AI – Tutor de Álgebra Adaptativo

EduAdapt AI es una plataforma educativa inteligente que proporciona un tutor virtual de álgebra con capacidad de adaptación dinámica al nivel del estudiante. Combina un motor de recomendación contextual, procesamiento de lenguaje natural (NLP) y generación de texto mediante RAG (Retrieval-Augmented Generation) para ofrecer una experiencia de aprendizaje personalizada.

## 🚀 Características

* **Práctica adaptativa**: selección dinámica de preguntas según el dominio (`mastery`) del estudiante.
* **Chat conversacional con IA**: interpreta la intención y el tema de las consultas del estudiante.
* **Recomendación de recursos educativos**: sugiere vídeos, textos y ejercicios interactivos.
* **Diagnóstico inicial**: registro con autopercepción y cuestionario para generar el vector de estado `S` (matriz de mastery por tema).
* **Seguimiento de progreso**: perfil de estudiante con ruta crítica y gráficas de dominio por tema.
* **Integración con Firebase**: autenticación, almacenamiento de perfiles y sesiones en Firestore.
* **Modelos de IA entrenados**:

  * Recomendador contextual (RandomForest / GradientBoosting / MLP).
  * Clasificador de intención y tema (NLP con TF-IDF + LogisticRegression).
  * RAG + LLM (DialoGPT ligero con búsqueda semántica en ChromaDB).

## 🛠️ Tecnologías utilizadas

| Componente                | Tecnología                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Backend                   | Python 3.11, Flask, Firebase Admin SDK                                                 |
| Frontend                  | HTML5, CSS3, JavaScript (ES6)                                                          |
| Autenticación y BD        | Firebase Auth, Firestore                                                               |
| Modelos de IA             | scikit-learn, joblib, pickle, sentence-transformers, ChromaDB, Transformers (DialoGPT) |
| Procesamiento de lenguaje | NLTK, TF-IDF, Regresión Logística, SVM                                                 |
| Visualización             | CSS Grid, Flexbox, barras de progreso dinámicas                                        |

## 📁 Estructura del proyecto

```text
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
│   │   ├── train_models.py
│   │   ├── test_NLP.py
│   │   ├── text_processing.py
│   │   └── results/
│   │       └── best_nlp_model.pkl
│   └── Recommenders/
│       ├── train_recommenders.py
│       ├── test_recommender.py
│       └── results/
│           ├── recommender_components.pkl
│           └── training_report.txt
├── data/
│   ├── algebra_questions.json
│   └── resources.json
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── css/
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
├── .gitignore
├── requirements.txt
└── README.md
```

## ⚙️ Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/sanscs1203/eduapt-ai.git
cd eduapt-ai
```

### 2. Crear y activar un entorno virtual

```bash
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

Si no existe el archivo `requirements.txt`:

```bash
pip install flask flask-cors firebase-admin scikit-learn pandas numpy scipy joblib chromadb sentence-transformers torch transformers nltk sympy python-dotenv
```

### 4. Configurar Firebase

1. Crear un proyecto en Firebase Console.
2. Habilitar Authentication (correo y contraseña).
3. Habilitar Firestore Database.
4. Descargar el archivo de credenciales de la cuenta de servicio.
5. Guardarlo en la raíz del proyecto como:

```text
firebase-service-account.json
```

Opcionalmente, utilizar un archivo `.env`:

```env
FIREBASE_CREDENTIALS=firebase-service-account.json
FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
```

### 5. Entrenar modelos (opcional)

#### Recomendador contextual

```bash
python models/Recommenders/train_recommenders.py
```

Archivos generados:

```text
models/Recommenders/results/
├── recommender_components.pkl
└── training_report.txt
```

#### Clasificador NLP

```bash
python models/NLP/train_models.py
```

Requiere:

```text
data/nlp_training_data_pro.json
```

Archivo generado:

```text
models/NLP/results/best_nlp_model.pkl
```

### 6. Ejecutar el backend

```bash
cd backend
python app.py
```

Servidor disponible en:

```text
http://127.0.0.1:5000
```

### 7. Servir el frontend

```bash
python -m http.server 8000
```

Acceder desde:

```text
http://localhost:8000/login.html
```

> **Nota:** Verifica que `API_BASE_URL` en `frontend/js/config.js` coincida con la dirección del backend.

---

## 📊 Uso del sistema

### Registro

El estudiante:

* Completa el formulario de registro.
* Selecciona preferencias de estudio.
* Responde el diagnóstico adaptativo (autopercepción + preguntas diagnósticas).
* Obtiene su vector de estado `S` (mastery por tema).

### Inicio de sesión

Ingresar con:

* Nombre de usuario.
* Contraseña.

### Tutor adaptativo

El estudiante puede:

* Seleccionar un tema desde la interfaz.
* Solicitar recursos educativos.
* Iniciar sesiones de práctica.
* Responder preguntas adaptadas a su nivel.
* Proporcionar retroalimentación.
* Consultar su perfil y progreso.

---

## 🤖 Modelos de IA implementados

### Recomendador contextual

**Algoritmos evaluados**

* Random Forest
* Gradient Boosting
* MLP Regressor

**Variables utilizadas**

* `topic`
* `difficulty`
* `item_type`
* `mastery_before`
* `streak_before`
* `intent`

**Salida**

* Predicción de relevancia.
* Selección de recursos Top-N.

### Clasificador NLP

**Arquitectura**

* TF-IDF de palabras.
* TF-IDF de caracteres.
* Clasificador lineal.

**Modelos probados**

* Logistic Regression
* SGD Classifier
* Naive Bayes

**Tareas**

* Detección de intención.
* Clasificación temática.

### RAG + LLM

**Recuperación**

* ChromaDB
* Embeddings `all-MiniLM-L6-v2`

**Generación**

* DistilGPT2
* Respuestas enriquecidas mediante recuperación semántica.

**Objetivo**

* Resolver dudas abiertas.
* Complementar recomendaciones y explicaciones.

---

## 📝 API principal

| Método | Endpoint             | Descripción                            |
| ------ | -------------------- | -------------------------------------- |
| POST   | `/api/session/start` | Iniciar sesión de práctica             |
| POST   | `/api/evaluate`      | Evaluar respuesta y actualizar mastery |
| POST   | `/api/session/close` | Finalizar sesión                       |
| POST   | `/api/chat`          | Procesar mensaje del estudiante        |
| POST   | `/api/recommend`     | Obtener recomendaciones                |
| POST   | `/api/resources`     | Obtener recursos por tema              |
| POST   | `/api/feedback`      | Registrar retroalimentación            |
| GET    | `/api/profile/<uid>` | Obtener perfil del estudiante          |

---

## 🧪 Evaluación de modelos

### NLP

```bash
python models/NLP/test_NLP.py
```

Requiere:

```text
data/nlp_test_real_data.json
```

Genera:

```text
models/NLP/results/test_report.txt
```

### Recomendador

```bash
python models/Recommenders/test_recommender.py
```

Genera:

```text
models/Recommenders/results/evaluation_report.txt
```

Incluye métricas como:

* Top-5 Suitability
* Error de predicción
* Ranking de recomendaciones

---

## 📄 Licencia

Este proyecto se distribuye con fines educativos y académicos.

Para usos comerciales, redistribución o contribuciones externas, contactar al autor del proyecto.

---

## 🙏 Agradecimientos

* Firebase
* Scikit-Learn
* Hugging Face Transformers
* ChromaDB
* Sentence Transformers
* Comunidad Open Source

---

## 📧 Contacto

Para reportar errores, realizar sugerencias o contribuir:

* GitHub: https://github.com/sanscs1203
* Repositorio: https://github.com/sanscs1203/eduapt-ai

También puedes abrir un *Issue* directamente en el repositorio.

