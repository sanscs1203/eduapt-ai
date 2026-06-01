# agents/student_model.py
# Modelo del estudiante (Vector S). Gestiona el nivel de dominio (mastery) por tema,
# asigna dificultad objetivo y calcula el nivel (Novato/Intermedio/Avanzado).

import numpy as np

class StudentModel:
    def __init__(self):
        self.difficulty_levels = ['Easy', 'Medium', 'Hard']
        self.diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}

    def initial_state(self, level='mid'):
        """
        Devuelve el estado inicial del estudiante.
        Actualmente retorna una lista vacía (modelo multi-tema). En el futuro podría inicializarse con valores por defecto.
        """
        return []   # Lista vacía; el frontend o la sesión agregarán temas al usar

    def get_mastery_for_topic(self, S, topic):
        """Obtiene el mastery (0..1) para un tema específico desde el vector S."""
        if isinstance(S, list):
            for t in S:
                if t.get('topic') == topic:
                    return t.get('mastery', 0.5)
            return 0.5
        elif isinstance(S, dict):
            # Formato antiguo: 'a' representa precisión general
            return S.get('a', 0.5)
        return 0.5

    def get_target_difficulty(self, S, topic=None):
        """
        Recomienda la dificultad ('Easy', 'Medium', 'Hard') según el mastery.
        Si S es lista y se da topic, usa el mastery de ese tema; si no, usa 'a' (formato antiguo).
        """
        if isinstance(S, list):
            topic_data = next((t for t in S if t.get('topic') == topic), {})
            mastery = topic_data.get('mastery', 0.5)
        elif isinstance(S, dict) and 'a' in S:
            mastery = S['a']
        else:
            return 'Medium'

        if mastery >= 0.85:
            return 'Hard'
        elif mastery >= 0.6:
            return 'Medium'
        else:
            return 'Easy'

    def get_tier(self, S, topic=None):
        """Devuelve una etiqueta de nivel: 'Novato', 'Intermedio' o 'Avanzado'."""
        mastery = 0.5
        if topic and isinstance(S, list):
            mastery = self.get_mastery_for_topic(S, topic)
        elif isinstance(S, dict) and 'a' in S:
            mastery = S['a']
        # Nota: cuando S es lista sin topic, se usa 0.5 -> Intermedio
        if mastery >= 0.8:
            return 'Avanzado'
        elif mastery >= 0.5:
            return 'Intermedio'
        else:
            return 'Novato'

    def update(self, S_old, is_correct, response_time, self_level='mid'):
        """
        Actualiza el vector S después de una respuesta.
        Soporta formato antiguo (dict) con parámetros a,t,f,d.
        Para el nuevo formato (lista), actualmente devuelve S_old sin cambios.
        (La actualización granular por tema se realiza en los endpoints con update_mastery_for_topic)
        """
        if isinstance(S_old, dict):
            S = S_old.copy()
            factor = 0.12 if is_correct else 0.08
            if is_correct:
                S['a'] = min(1.0, S.get('a', 0.5) + factor * (1 - S.get('a', 0.5)))
                S['t'] = max(0.0, S.get('t', 0.5) - 0.05)   # t: tiempo de respuesta (mejora)
                S['f'] = max(0.0, S.get('f', 0.5) - 0.02)   # f: frecuencia de práctica
                S['d'] = min(1.0, S.get('d', 0.5) + 0.03)   # d: dificultad enfrentada
            else:
                S['a'] = max(0.0, S.get('a', 0.5) - factor * S.get('a', 0.5))
                S['t'] = min(1.0, S.get('t', 0.5) + 0.05)
                S['f'] = min(1.0, S.get('f', 0.5) + 0.04)
                S['d'] = max(0.0, S.get('d', 0.5) - 0.03)
            return S
        else:
            # Formato lista: no se actualiza aquí; la sesión o el endpoint se encargan
            return S_old