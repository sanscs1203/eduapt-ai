import torch
import torch.nn as nn
from .base_llm import BaseLLM

class Seq2SeqAttentionLLM(BaseLLM):
    def __init__(self):
        # Placeholder: modelo entrenado previamente o cargado
        self.model = None

    def generate(self, message, context=None):
        # Por ahora, respuesta por defecto
        return f"Entiendo tu consulta: '{message}'. Estoy aquí para ayudarte con álgebra."

    def name(self):
        return "Seq2Seq con Atención"