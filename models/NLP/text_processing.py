import re

from nltk.stem.snowball import SnowballStemmer

from sklearn.base import BaseEstimator, TransformerMixin

stemmer = SnowballStemmer("spanish")

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
    - palabras normales (reducidas a su raíz/stem)
    - tokens especiales e_xxx (se mantienen intactos)
    """

    pattern = r'(?u)[a-záéíóúñü0-9]+|e_\w+'

    tokens = re.findall(pattern, text)

    stemmed_tokens = [
        stemmer.stem(token) if not token.startswith("e_") else token 
        for token in tokens
    ]

    return stemmed_tokens

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