# agents/student_model.py

class StudentModel:
    """Modelo del estudiante S = [a, t, f, d]"""

    @staticmethod
    def initial_state(self_level='mid'):
        """Estado inicial según auto-nivel"""
        self_map = {'low': 0.3, 'mid': 0.5, 'high': 0.7}
        base = self_map.get(self_level, 0.5)
        return {
            'a': base,   # accuracy (EMA)
            't': 0.5,    # time score (normalized)
            'f': 0.1,    # attempt frequency
            'd': base    # domain mastery
        }

    @staticmethod
    def update(S, is_correct: bool, response_time_sec: float, self_level='mid'):
        """
        Actualiza el vector de estado S usando medias móviles exponenciales.
        Retorna el nuevo S.
        """
        alpha = 0.3  # factor de suavizado

        # a: accuracy (EMA)
        new_a = alpha * (1 if is_correct else 0) + (1 - alpha) * S['a']

        # t: tiempo de respuesta normalizado (20s = rápido, 120s = lento)
        clamped = max(20, min(120, response_time_sec))
        time_score = 1 - (clamped - 20) / 100
        new_t = 0.3 * time_score + 0.7 * S['t']

        # f: frecuencia (incremento gradual)
        new_f = min(1.0, S['f'] + 0.05)

        # d: dominio = combinación ponderada de accuracy, tiempo y auto-nivel
        self_map = {'low': 0.3, 'mid': 0.6, 'high': 0.9}
        self_val = self_map.get(self_level, 0.5)
        new_d = 0.5 * new_a + 0.2 * new_t + 0.3 * self_val

        return {
            'a': round(new_a, 4),
            't': round(new_t, 4),
            'f': round(new_f, 4),
            'd': round(new_d, 4)
        }

    @staticmethod
    def get_target_difficulty(S):
        """Determina la dificultad objetivo según la precisión"""
        if S['a'] >= 0.85:
            return 'Hard'
        if S['a'] >= 0.45:
            return 'Medium'
        return 'Easy'

    @staticmethod
    def get_tier(S):
        """Nivel de aprendizaje para explicabilidad"""
        if S['a'] >= 0.85:
            return 'Challenge'
        if S['a'] >= 0.70:
            return 'Advancement'
        if S['a'] >= 0.45:
            return 'Reinforcement'
        return 'Remedial'