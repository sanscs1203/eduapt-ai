# QUESTION_BANK_AUDIT.md
## EduAdapt AI — Auditoría del banco de preguntas
**Fecha:** 2026-05-04

Compara `QUESTION_BANK` (en `script.js`) con `QUESTIONS` (en `upload_questions.html`).

---

## Recuento de preguntas por tema

| Tema | script.js | upload_questions.html |
|---|---|---|
| polinomios | 7 | 7 |
| factorizacion | 7 | 7 |
| ecuaciones | 7 | 7 |
| sistemas | 7 | 6 |
| fracciones | 7 | 7 |
| potencias | 7 | 7 |
| funciones | 8 | 8 |
| inecuaciones | 7 | 7 |
| **Total** | **57** | **56** |

> **Nota:** `upload_questions.html` declara 55 preguntas en el encabezado pero contiene 56. El total real es 56 vs 57 en script.js.

---

## Diferencias por tema

### sistemas — 1 pregunta extra en script.js

`script.js` tiene SYS-01 a SYS-07 (7 preguntas).  
`upload_questions.html` tiene SYS-01 a SYS-06 (6 preguntas).

La pregunta **SYS-07** existe solo en `script.js`:

| Campo | script.js (SYS-07) |
|---|---|
| question | `Resuelve: { 2x + 3y = 12,  4x − y = 5 }` |
| answer | `x = 1.5, y = 3` |

> **Bug matemático (corregido):** La respuesta `x = 1.5, y = 3` es incorrecta.  
> Verificación: 4(1.5) − 3 = 3 ≠ 5.  
> La corrección aplica `2x + 3y = 13` → `x = 2, y = 3` (ya corregido en script.js).

La pregunta **SYS-06** difiere entre fuentes:

| Campo | script.js (SYS-06) | upload_questions.html (SYS-06) |
|---|---|---|
| question | `Resuelve por sustitución: { y = 2x − 1, 3x + y = 14 }` | `Resuelve: { 2x + 3y = 13, 4x − y = 5 }` |
| answer | `x = 3, y = 5` | `x = 2, y = 3` |

> **Impacto:** El sistema adaptativo usa exclusivamente `QUESTION_BANK` de `script.js`. Las preguntas de `upload_questions.html` se suben a Firestore mediante la utilidad de carga pero la lógica del tutor no las lee desde Firestore.

---

### fracciones — contenido diferente en FRA-01 y FRA-02

| ID | script.js | upload_questions.html |
|---|---|---|
| FRA-01 | ¿Qué condición debe cumplir el denominador de una fracción algebraica? / `No puede ser igual a cero` | `Simplifica: (x² + 5x + 6) / (x + 2) (x ≠ −2)` / `x + 3` |
| FRA-02 | `Simplifica: (6x²) / (3x) (x ≠ 0)` / `2x` | `Suma: 1/3x + 2/3x (x ≠ 0)` / `1/x` |

> **Impacto:** Las preguntas conceptuales de fracciones (explicar restricción del dominio) están solo en `script.js`. Las preguntas de cálculo de `upload_questions.html` son distintas.

---

### topicLabel — diferencias en etiquetas

| Tema | script.js TOPIC_LABELS | upload_questions.html topicLabel |
|---|---|---|
| ecuaciones | `Ecuaciones lineales` | `Ecuaciones Lineales` |
| fracciones | `Fracciones algebraicas` | `Fracciones Algebraicas` |
| sistemas | `Sistemas de ecuaciones` | `Sistemas de Ecuaciones` |

> Solo capitalización diferente. Sin impacto funcional.

---

## Errores matemáticos corregidos

| ID | Tipo | Detalle |
|---|---|---|
| SYS-07 | Bug (corregido) | `{ 2x + 3y = 12, 4x − y = 5 }` con respuesta `x = 1.5, y = 3` es incorrecto. Corregido a `{ 2x + 3y = 13, 4x − y = 5 }` → `x = 2, y = 3`. |

---

## Recomendaciones

1. El banco activo del tutor es `QUESTION_BANK` en `script.js`. Es la única fuente de verdad para el piloto.
2. Las preguntas de `upload_questions.html` no se usan en el tutor a menos que se integre carga dinámica desde Firestore.
3. Corregir el encabezado de `upload_questions.html` de "55 preguntas" a "56 preguntas".
4. Evaluar si las variantes de FRA-01/FRA-02 de `upload_questions.html` deben reemplazar o complementar las actuales.
