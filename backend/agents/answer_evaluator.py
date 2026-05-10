# agents/answer_evaluator.py
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import re

class AnswerEvaluator:
    def __init__(self):
        self.transformations = standard_transformations + (implicit_multiplication_application,)

    def evaluate(self, user_answer: str, correct_answer: str, question_type: str):
        """
        Evalúa la respuesta del estudiante contra la respuesta correcta.
        Retorna dict: { is_correct: bool, explanation: str, method: str }
        """
        if question_type == 'Conceptual':
            return self._evaluate_conceptual(user_answer, correct_answer)

        if question_type == 'Procedural':
            return self._evaluate_procedural(user_answer, correct_answer)

        # Por defecto, intentar SymPy
        return self._evaluate_procedural(user_answer, correct_answer)

    def _evaluate_conceptual(self, user: str, expected: str):
        """Evaluación de preguntas conceptuales mediante similitud de tokens"""
        user_lower = user.lower()
        expected_lower = expected.lower()

        # Extraer tokens clave del expected (palabras > 2 letras y números)
        tokens = re.findall(r'[a-záéíóúñü0-9]{2,}', expected_lower)

        if not tokens:
            return {'is_correct': False, 'explanation': 'No se pudieron extraer tokens de la respuesta esperada.', 'method': 'text-similarity'}

        # Contar coincidencias
        matches = sum(1 for t in tokens if t in user_lower)
        threshold = max(1, int(len(tokens) * 0.4))
        is_correct = matches >= threshold

        explanation = (
            f"Tu respuesta contiene {matches} de {len(tokens)} conceptos clave "
            f"(umbral: {threshold}). " +
            ("¡Correcto!" if is_correct else "Revisa los conceptos clave.")
        )
        return {'is_correct': is_correct, 'explanation': explanation, 'method': 'semantic-overlap'}

    def _evaluate_procedural(self, user: str, expected: str):
        """Evaluación de respuestas algebraicas usando SymPy"""
        user_sympy = self._normalize_and_parse(user)
        expected_sympy = self._normalize_and_parse(expected)

        if user_sympy is None or expected_sympy is None:
            # Fallback a comparación de texto normalizado
            return self._text_fallback(user, expected)

        try:
            # Comparar expresiones simplificadas
            diff = sp.simplify(user_sympy - expected_sympy)
            is_correct = diff == 0

            explanation = (
                "Tu respuesta es algebraicamente equivalente a la solución correcta."
                if is_correct
                else f"La diferencia entre tu respuesta y la solución es: {diff}"
            )
            return {
                'is_correct': is_correct,
                'explanation': explanation,
                'method': 'sympy-algebraic'
            }
        except Exception as e:
            return self._text_fallback(user, expected)

    def _normalize_and_parse(self, text: str):
        """Normaliza texto matemático y lo convierte a expresión SymPy"""
        try:
            # Normalizar exponentes Unicode → ASCII
            normalized = text.strip()
            normalized = normalized.replace('−', '-')  # minus sign
            normalized = normalized.replace('⁰', '**0').replace('¹', '**1')
            normalized = normalized.replace('²', '**2').replace('³', '**3')
            normalized = normalized.replace('⁴', '**4').replace('⁵', '**5')
            normalized = normalized.replace('⁶', '**6').replace('⁷', '**7')
            normalized = normalized.replace('⁸', '**8').replace('⁹', '**9')
            normalized = normalized.replace('√', 'sqrt')
            normalized = normalized.replace('·', '*')

            # Reemplazar ^ por ** para SymPy
            normalized = normalized.replace('^', '**')

            # Manejar "x = 6" → solo "6", o "x = 6, y = 2" → "(6, 2)"
            var_eq_pattern = re.findall(r'([a-z])\s*=\s*([^,\s]+)', normalized)
            if var_eq_pattern:
                if len(var_eq_pattern) == 1:
                    # Una sola variable: extraer el valor
                    normalized = var_eq_pattern[0][1]
                else:
                    # Múltiples variables: comparar como tupla de valores
                    values = [v[1] for v in var_eq_pattern]
                    normalized = '(' + ', '.join(values) + ')'

            return parse_expr(normalized, transformations=self.transformations)
        except Exception:
            return None

    def _text_fallback(self, user: str, expected: str):
        """Fallback a comparación de texto normalizado"""
        norm_user = self._normalize_text(user)
        norm_expected = self._normalize_text(expected)

        is_correct = norm_user == norm_expected

        # Si no son idénticos, intentar extraer valores numéricos
        if not is_correct:
            user_nums = re.findall(r'-?\d+\.?\d*', norm_user)
            exp_nums = re.findall(r'-?\d+\.?\d*', norm_expected)
            if user_nums and exp_nums and user_nums == exp_nums:
                is_correct = True

        return {
            'is_correct': is_correct,
            'explanation': 'Comparación textual de expresiones normalizadas.',
            'method': 'text-normalized'
        }

    def _normalize_text(self, text: str) -> str:
        text = text.lower().strip()
        text = text.replace('−', '-')
        text = re.sub(r'\s+', '', text)
        return text