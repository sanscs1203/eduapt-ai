import re

from sklearn.base import BaseEstimator, TransformerMixin

# =========================================================
# MAPA DE EMOJIS
# =========================================================

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

# =========================================================
# LIMPIEZA DE TEXTO
# =========================================================

def clean_text(text: str) -> str:
    """
    Limpieza básica para NLP:
    - minúsculas
    - reemplazo de emojis
    - eliminación de símbolos
    - espacios duplicados
    """

    text = text.lower().strip()

    # Reemplazo de emojis
    for emoji_code, token in EMOJI_MAP.items():
        text = text.replace(emoji_code, token)

    # Eliminar signos innecesarios
    text = re.sub(
        r'[¿?¡!.,;:"\'()\[\]]+',
        ' ',
        text
    )

    # Espacios múltiples
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# =========================================================
# TOKENIZER PERSONALIZADO
# =========================================================

def custom_tokenizer(text):
    """
    Tokenizador compatible con:
    - palabras normales
    - tokens especiales e_xxx
    """

    pattern = r'(?u)[a-záéíóúñü0-9]+|e_\w+'

    return re.findall(pattern, text)

# =========================================================
# PREPROCESSOR SKLEARN
# =========================================================

class TextPreprocessor(BaseEstimator, TransformerMixin):

    def fit(self, X, y=None):
        return self

    def transform(self, X):

        return [
            clean_text(text)
            for text in X
        ]