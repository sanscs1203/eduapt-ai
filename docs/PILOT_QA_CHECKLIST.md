# PILOT_QA_CHECKLIST.md
## EduAdapt AI — Lista de verificación pre-piloto
**Fecha:** 2026-05-04

Marca cada ítem antes de iniciar el piloto formal. Usa ✅ cuando esté confirmado o ❌ si hay problema.

---

## 1. Infraestructura Firebase

- [ ] Abrir `export_firestore.html` con servidor local (`python -m http.server 8000`).
- [ ] Iniciar sesión con la cuenta del administrador del piloto.
- [ ] Confirmar que el login muestra el email correcto y la sección de exportación es visible.
- [ ] Hacer clic en **Cargar datos** y verificar que las 4 colecciones respondan sin error en el log.
- [ ] Verificar que el preview de la tabla **Sesiones** aparece (aunque esté vacía si es sesión nueva).

---

## 2. Flujo de registro y diagnóstico

- [ ] Abrir `http://localhost:8000/login.html`.
- [ ] Hacer clic en **Registrarse** y completar el registro de un usuario piloto (nombre, correo, contraseña).
- [ ] Completar el cuestionario diagnóstico (8 preguntas de opción múltiple).
- [ ] Verificar que la pantalla de resultado muestra `S = [a, t, f, d]` con valores numéricos.
- [ ] Verificar que en Firestore > colección `users` aparece el nuevo documento con campo `S`.

---

## 3. Sesión baseline (modo Tradicional)

- [ ] En `index.html`, confirmar que el modo activo es **📋 Tradicional** (botón resaltado).
- [ ] Seleccionar un tema (ej: Ecuaciones lineales).
- [ ] Verificar que la primera pregunta es la primera del banco en orden fijo (EQL-01 Easy/Conceptual).
- [ ] Responder 5 preguntas. Incluir al menos 1 correcta, 1 incorrecta y 1 "ver respuesta".
- [ ] Verificar que tras la 5.ª pregunta aparece el mensaje de **Sesión piloto completada** y el resumen.
- [ ] Verificar que el resumen muestra: modo, duración, preguntas, precisión, recomendaciones.
- [ ] Verificar en Firestore > colección `sessions` que el documento tiene `pilotMode: "baseline"`.
- [ ] Verificar en Firestore > colección `interactions` que hay 5 documentos de la sesión.

---

## 4. Cambio de modo

- [ ] Con sesión activa (antes de llegar a 5 preguntas), hacer clic en el botón **🧠 Adaptativo**.
- [ ] Verificar que el resumen de la sesión en curso aparece antes del cambio de modo.
- [ ] Verificar que el mensaje de confirmación de cambio de modo aparece en el chat.
- [ ] Verificar que el botón **Adaptativo** queda resaltado.

---

## 5. Sesión adaptativa (modo Adaptativo)

- [ ] Confirmar que el modo activo es **🧠 Adaptativo**.
- [ ] Seleccionar el mismo tema que en la sesión baseline.
- [ ] Verificar que la primera pregunta corresponde a la dificultad apropiada según `S.a` actual:
  - `S.a < 0.45` → Easy
  - `0.45 ≤ S.a < 0.85` → Medium
  - `S.a ≥ 0.85` → Hard
- [ ] Responder 5 preguntas. Verificar que la dificultad se ajusta según el rendimiento.
- [ ] Verificar que tras la 5.ª pregunta aparece el mensaje de **Sesión piloto completada** y el resumen.
- [ ] Verificar en Firestore > colección `sessions` que el documento tiene `pilotMode: "adaptive"`.
- [ ] Verificar que `S_gain_a` (ganancia en precisión) es visible en el resumen de sesión.

---

## 6. Evaluador de respuestas

- [ ] Pregunta EQL-02 (`2x + 5 = 17`, respuesta `x = 6`):
  - Escribir `6` → debe marcar ✅ correcto.
  - Escribir `x = 6` → debe marcar ✅ correcto.
  - Escribir `x = 5` → debe marcar ❌ incorrecto.
- [ ] Pregunta SYS-02 (`x + y = 5, x − y = 1`, respuesta `x = 3, y = 2`):
  - Escribir `x = 3, y = 2` → debe marcar ✅ correcto.
  - Escribir `y = 2, x = 3` → debe marcar ✅ correcto (orden invertido).
  - Escribir `x = 3` → debe marcar ❌ incorrecto (falta `y`).
- [ ] Pregunta POW-02 (`x³ · x²`, respuesta `x⁵`):
  - Escribir `x^5` → debe marcar ✅ correcto.
  - Escribir `x5` → debe marcar ✅ correcto (token `5` presente).
  - Escribir `x^3` → debe marcar ❌ incorrecto.

---

## 7. Feedback de recursos

- [ ] Tras una respuesta (correcta o incorrecta), verificar que aparece la pregunta de feedback.
- [ ] Escribir `me sirvió` → confirmar el mensaje de agradecimiento.
- [ ] Verificar en Firestore > colección `feedback` el documento con `useful: true`.
- [ ] Escribir `no me sirvió` → confirmar el mensaje de registro.
- [ ] Verificar en Firestore > colección `feedback` el documento con `useful: false`.
- [ ] Verificar que al escribir cualquier otra cosa, el feedback se descarta sin error.

---

## 8. Persistencia ante cierre inesperado

- [ ] Iniciar una sesión (responder al menos 1 pregunta).
- [ ] Cerrar la pestaña del navegador sin hacer logout.
- [ ] Volver a abrir `index.html` e iniciar sesión.
- [ ] Verificar en Firestore > colección `sessions` que la sesión anterior fue guardada.

---

## 9. Self-tests del evaluador

- [ ] Abrir `index.html` en el navegador.
- [ ] Abrir la consola del desarrollador (F12).
- [ ] Ejecutar: `window.runEduAdaptSelfTests()`
- [ ] Verificar que todos los tests muestran `[PASS]`.
- [ ] Verificar el resumen final: `[EduAdapt Self-Tests] N/N passed`.

---

## 10. Exportación de datos

- [ ] Abrir `export_firestore.html`.
- [ ] Hacer clic en **Cargar datos** y confirmar 4 colecciones sin error.
- [ ] Hacer clic en **Descargar Excel** y confirmar descarga del archivo `.xlsx`.
- [ ] Abrir el archivo y verificar que tiene exactamente **5 hojas**: Usuarios, Sesiones, Interacciones, Feedback, Resumen.
- [ ] Verificar que la hoja **Resumen** tiene la tabla de comparación con filas `baseline` y `adaptive`.
- [ ] Verificar que las columnas de comparación incluyen: accuracy, tiempo, S.a inicial, S.a final, ganancia S.a, feedback útil.

---

## Estado del piloto

| Ítem | Estado |
|---|---|
| Firebase conectado | ⬜ |
| Registro + diagnóstico | ⬜ |
| Sesión baseline completada | ⬜ |
| Sesión adaptativa completada | ⬜ |
| Evaluador verificado | ⬜ |
| Feedback registrado | ⬜ |
| Self-tests: todos PASS | ⬜ |
| Excel exportado | ⬜ |

> Actualiza esta tabla con ✅ o ❌ durante la verificación.
