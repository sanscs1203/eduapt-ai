# models/NLP/text_processing.py
# Módulo de preprocesamiento de texto para el pipeline de NLP.
# Incluye limpieza, tokenización con stemming y transformador compatible con scikit-learn.

import re
import nltk
from nltk.stem.snowball import SnowballStemmer
from sklearn.base import BaseEstimator, TransformerMixin

# Descargar recursos de NLTK necesarios (solo la primera vez)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

# Inicializar el stemmer para español
stemmer = SnowballStemmer("spanish")

# ============================================================================
# MAPA DE EMOJIS A TOKENS ESPECIALES
# ============================================================================
# Los emojis se reemplazan por tokens como "e_plegarias" para que el modelo
# pueda capturar su significado sin depender de caracteres Unicode.
EMOJI_MAP = {
    "🙏": " e_plegarias ",
    "💀": " e_calavera ",
    "😅": " e_sweat_smile ",
    "😭": " e_llanto ",
    "😔": " e_pensativo ",
    ":D": " e_risaD ",
    ":(": " e_triste ",
    "xd": " e_xd ",
}


# ============================================================================
# LIMPIEZA DE TEXTO
# ============================================================================
def clean_text(text: str) -> str:
    """
    Limpia un texto aplicando:
    - Minúsculas
    - Reemplazo de emojis por tokens especiales
    - Eliminación de signos de puntuación y símbolos innecesarios
    - Normalización de espacios múltiples

    Parámetros:
        text (str): Texto crudo del usuario.

    Retorna:
        str: Texto limpio listo para tokenización.
    """
    text = text.lower().strip()

    # Reemplazar emojis según el mapa
    for emoji_code, token in EMOJI_MAP.items():
        text = text.replace(emoji_code, token)

    # Eliminar signos de puntuación y otros caracteres que no aportan
    text = re.sub(r'[¿?¡!.,;:"\'()\[\]]+', ' ', text)

    # Reemplazar espacios múltiples por uno solo
    text = re.sub(r'\s+', ' ', text).strip()

    return text


# ============================================================================
# TOKENIZADOR PERSONALIZADO CON STEMMING
# ============================================================================
def custom_tokenizer(text: str):
    """
    Tokenizador que:
    - Extrae palabras (alfanuméricas y con acentos) y tokens especiales (e_xxx).
    - Aplica stemming (reducción a raíz) a las palabras comunes.
    - Mantiene intactos los tokens especiales (emojis).

    Parámetros:
        text (str): Texto ya limpio.

    Retorna:
        list[str]: Lista de tokens procesados.
    """
    # Patrón: palabras con letras españolas, números, o tokens e_...
    pattern = r'(?u)[a-záéíóúñü0-9]+|e_\w+'
    tokens = re.findall(pattern, text)

    # Aplicar stemming solo a tokens que no sean especiales (no empiezan con e_)
    stemmed_tokens = [
        stemmer.stem(token) if not token.startswith("e_") else token
        for token in tokens
    ]
    return stemmed_tokens


# ============================================================================
# TRANSFORMADOR PARA PIPELINE DE SCIKIT-LEARN
# ============================================================================
class TextPreprocessor(BaseEstimator, TransformerMixin):
    """
    Transformador personalizado que se integra en un pipeline de scikit-learn.
    Aplica `clean_text` a cada elemento de una lista de textos.
    """

    def fit(self, X, y=None):
        """Método fit (no hace nada, solo retorna self)."""
        return self

    def transform(self, X):
        """
        Transforma una lista de textos aplicando `clean_text`.

        Parámetros:
            X (list[str]): Lista de textos crudos.

        Retorna:
            list[str]: Lista de textos limpios.
        """
        return [clean_text(text) for text in X]