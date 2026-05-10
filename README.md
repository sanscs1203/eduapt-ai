# EduAdapt AI

## Overview

EduAdapt AI is a web-based adaptive tutoring platform for Algebra. It uses learning analytics, a rule-based adaptive decision engine, and feedback logging to recommend questions and learning resources according to student performance.

The system was developed as a small-scale academic prototype for evaluating adaptive tutoring behavior against a baseline/traditional practice mode.

## Main Features

- Firebase login and registration.
- Initial diagnostic quiz.
- Student state model `S = [a, t, f, d]`.
- Algebra question bank.
- Adaptive mode.
- Baseline/traditional mode.
- Session and interaction logging.
- Feedback logging: useful / not useful.
- Data export to Excel.
- Basic content upload utility through `upload_questions.html`.

## Student State Model

EduAdapt AI represents each learner with the state vector:

```text
S = [a, t, f, d]
```

Where:

- `a` = accuracy/mastery estimate.
- `t` = normalized response-time indicator.
- `f` = interaction frequency / practice exposure.
- `d` = combined difficulty/readiness indicator.

The student state is initialized after the diagnostic quiz and updated after each answered question using an exponential moving average. This allows the platform to adjust the learner profile gradually as the student practices.

## Decision Engine

The final implemented decision engine is rule-based and explainable.

Baseline mode delivers questions in the fixed order defined by the question bank. Adaptive mode selects questions according to the current student state and a target difficulty level.

The implemented target-difficulty thresholds are:

- `a < 0.45` -> Easy / Remedial.
- `0.45 <= a < 0.85` -> Medium / Reinforcement.
- `a >= 0.85` -> Hard / Challenge.

This project does not implement deep learning, k-nearest neighbors, decision trees, or other advanced machine-learning models. The adaptation logic is intentionally transparent so that its behavior can be inspected and reported clearly.

## Pilot Session Limit

Each pilot session is capped at **5 questions** (`PILOT_QUESTION_LIMIT = 5` in `script.js`). After the 5th answer the session closes automatically and saves a summary to Firestore. This makes baseline and adaptive session lengths comparable for A/B evaluation.

## Project Structure

```text
eduapt-ai/
|-- login.html
|-- register.html
|-- index.html
|-- script.js
|-- style.css
|-- export_firestore.html
|-- upload_questions.html
|-- QUESTION_BANK_AUDIT.md
|-- PILOT_QA_CHECKLIST.md
`-- Banco_preguntas_Algebra_EduAdaptAI_v3.xlsx
```

### Files

- `login.html`: Firebase-based login screen.
- `register.html`: user registration and initial diagnostic quiz.
- `index.html`: main tutoring interface.
- `script.js`: tutor logic, question bank, student state updates, adaptive/baseline modes, and Firestore logging.
- `style.css`: visual styles for the application.
- `export_firestore.html`: utility for exporting Firestore data to Excel. Requires authentication. Produces 5 sheets: Usuarios, Sesiones, Interacciones, Feedback, and Resumen (with baseline vs adaptive comparison).
- `upload_questions.html`: basic content upload utility for writing questions to Firestore. The active tutor uses the embedded `QUESTION_BANK` in `script.js`, not Firestore questions.
- `QUESTION_BANK_AUDIT.md`: differences between `QUESTION_BANK` (script.js) and `QUESTIONS` (upload_questions.html).
- `PILOT_QA_CHECKLIST.md`: step-by-step pre-pilot verification checklist.
- `Banco_preguntas_Algebra_EduAdaptAI_v3.xlsx`: Algebra question bank used as a project data source/reference.

## Firestore Collections

- `users`: registered student profiles, diagnostic quiz results, preferences, and initial student state.
- `sessions`: practice-session summaries, including mode, topic, metrics, and answered questions.
- `interactions`: individual question-level interaction records.
- `feedback`: useful / not useful feedback about recommended learning resources.
- `questions`: uploaded question documents created through the content upload utility.

## How to Run

EduAdapt AI is a static web application. It can be opened through a local HTTP server or deployed to static hosting.

Recommended local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/login.html
```

Typical execution flow:

1. Open `login.html` through a local server or deployed static hosting.
2. Register a new user.
3. Complete the diagnostic quiz.
4. Practice in baseline or adaptive mode.
5. Export data through `export_firestore.html`.

## Self-Tests

A suite of unit tests for `normalizeMathText`, `evaluateStudentAnswer`, and `updateS` can be run from the browser console on `index.html`:

```javascript
window.runEduAdaptSelfTests()
```

Results are printed to the console. Each test reports `[PASS]` or `[FAIL]` with expected vs actual values.

## Pilot Evaluation Procedure

A short pilot evaluation can be conducted as follows:

1. Open `export_firestore.html` and sign in to verify Firebase connectivity.
2. Open `index.html` through a local server and sign in.
3. Register pilot users via `register.html` and complete the diagnostic quiz.
4. Run a **baseline** (📋 Tradicional) session: select a topic, answer 5 questions, let the session close automatically.
5. Switch to **adaptive** (🧠 Adaptativo) mode — the active session closes and saves before the mode changes.
6. Run an **adaptive** session: select a topic, answer 5 questions, let the session close automatically.
7. Provide feedback ("me sirvió" / "no me sirvió") when prompted after each answer.
8. Export data via `export_firestore.html` → Download Excel.
9. Compare the **Resumen** sheet: accuracy, response time, S.a gain, and resource usefulness for baseline vs adaptive.

## Limitations

- EduAdapt AI is a small-scale academic prototype.
- The current scope is limited to Algebra.
- The decision engine is **rule-based and explainable**. It does not use deep learning, k-nearest neighbors, decision trees, or other machine-learning models. Adaptation is based entirely on the student state thresholds described above.
- Pilot sessions are capped at 5 questions (`PILOT_QUESTION_LIMIT`) to keep A/B comparison conditions equal. This limit is intentional.
- The answer evaluator uses normalized string matching and keyword overlap. It does not use a computer algebra system (CAS); symbolic equivalences beyond those implemented may not be recognized.
- Feedback currently influences local/session-level avoidance of non-useful resources: questions marked "no me sirvió" are excluded from the delivery pool for the remainder of that session if alternatives exist. Full automatic ranking optimization across sessions is future work.
- Similar-student collaborative recommendation is not implemented and remains future work.
- The adaptive learning path is generated as a text-based recommendation at the end of each session (`suggestedPath`), stored in Firestore and included in the Excel export. A visual learning-path map is future work.
- The question bank is limited (57 questions across 8 topics).
- The content upload utility writes to Firestore, but the active tutor reads from `QUESTION_BANK` in `script.js`. Dynamic loading from Firestore is future work.

## Future Work

- Larger user pilot.
- Dynamic loading of questions from Firestore.
- More robust symbolic math evaluator.
- Automatic feedback-weighted resource ranking.
- Expansion to other subjects.
