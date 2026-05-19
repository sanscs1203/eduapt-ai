import numpy as np

class StudentModel:
    def __init__(self):
        # Niveles de dificultad disponibles
        self.difficulty_levels = ['Easy', 'Medium', 'Hard']
        # Mapeo de orden de dificultad
        self.diff_order = {'Easy': 0, 'Medium': 1, 'Hard': 2}

    def initial_state(self, level='mid'):
        """
        Devuelve un Vector S inicial en formato antiguo (diccionario)
        o en formato nuevo (lista de temas) según prefieras.
        Aquí devolvemos el nuevo formato (lista vacía) para consistencia.
        """
        # Nuevo formato multi‑tema vacío
        return []

    def get_mastery_for_topic(self, S, topic):
        """Extrae el mastery del tópico dado desde cualquier formato de S."""
        if isinstance(S, list):
            for t in S:
                if t.get('topic') == topic:
                    return t.get('mastery', 0.5)
            return 0.5   # por defecto si no se encuentra
        elif isinstance(S, dict):
            # Formato antiguo: 'a' es la precisión general
            # (no tenemos información por tema, usamos 'a')
            return S.get('a', 0.5)
        return 0.5

    def get_target_difficulty(self, S, topic=None):
        """
        Devuelve la dificultad recomendada según el dominio del estudiante.
        Si S es lista y se proporciona topic, usa el mastery de ese tópico.
        Si S es dict, usa 'a'.
        """
        
        if isinstance(S, list):
            topic_data = next((t for t in S if t.get('topic') == topic), {})
            S = {'a': topic_data.get('mastery', 0.5)}
        
        mastery = 0.5
        if topic and isinstance(S, list):
            mastery = self.get_mastery_for_topic(S, topic)
        elif isinstance(S, dict) and 'a' in S:
            mastery = S['a']
        else:
            # Si no hay información, asumimos nivel medio
            return 'Medium'

        if mastery >= 0.85:
            return 'Hard'
        elif mastery >= 0.6:
            return 'Medium'
        else:
            return 'Easy'

    def get_tier(self, S, topic=None):
        """Devuelve una etiqueta de nivel (Novato, Intermedio, Avanzado)."""
        mastery = 0.5
        if topic and isinstance(S, list):
            mastery = self.get_mastery_for_topic(S, topic)
        elif isinstance(S, dict) and 'a' in S:
            mastery = S['a']

        if mastery >= 0.8:
            return 'Avanzado'
        elif mastery >= 0.5:
            return 'Intermedio'
        else:
            return 'Novato'

    def update(self, S_old, is_correct, response_time, self_level='mid'):
        """
        Actualiza el vector S después de una respuesta.
        Soporta el formato antiguo (dict) y el nuevo (lista de temas).
        Requiere que sepas el tópico actual para actualizar el elemento correspondiente.
        Como esta función se llama desde /evaluate, donde S_old puede ser una lista,
        pero no tenemos el tópico de la pregunta directamente (aunque podríamos obtenerlo).
        Para no romper el código existente, vamos a implementar un soporte mínimo:
          - Si S_old es dict (antiguo), actualiza 'a', 't', etc.
          - Si S_old es list, no lo actualizamos aquí (la sesión manejará el nuevo S mediante
            el endpoint /evaluate que recibe el tópico de la pregunta y puede pasarlo).
        De momento, simplemente devolvemos S_old sin cambios si es lista.
        """
        if isinstance(S_old, dict):
            # Código original de actualización para el formato antiguo
            S = S_old.copy()
            factor = 0.12 if is_correct else 0.08
            if is_correct:
                S['a'] = min(1.0, S.get('a', 0.5) + factor * (1 - S.get('a', 0.5)))
                S['t'] = max(0.0, S.get('t', 0.5) - 0.05)  # tiempo mejora
                S['f'] = max(0.0, S.get('f', 0.5) - 0.02)
                S['d'] = min(1.0, S.get('d', 0.5) + 0.03)
            else:
                S['a'] = max(0.0, S.get('a', 0.5) - factor * S.get('a', 0.5))
                S['t'] = min(1.0, S.get('t', 0.5) + 0.05)
                S['f'] = min(1.0, S.get('f', 0.5) + 0.04)
                S['d'] = max(0.0, S.get('d', 0.5) - 0.03)
            return S
        else:
            # Si es lista, por ahora no actualizamos; la sesión mantendrá el S sin cambios.
            # En una versión futura, recibiríamos el topic para actualizar el elemento correcto.
            return S_old