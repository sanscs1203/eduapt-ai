# backend/llm/base_llm.py
# Módulo que define la interfaz abstracta para todos los modelos de lenguaje (LLM)
# utilizados en el sistema. Cualquier integración con un LLM concreto (DialoGPT,
# OpenAI, etc.) debe heredar de esta clase e implementar sus métodos.

from abc import ABC, abstractmethod


class BaseLLM(ABC):
    """
    Clase base abstracta para todos los modelos de lenguaje (LLM) del sistema.
    
    Define el contrato mínimo que debe cumplir cualquier integración con un
    modelo generativo de texto (tutor conversacional). Al heredar de `ABC`,
    se asegura que las subclases implementen los métodos abstractos.
    """

    @abstractmethod
    def generate(self, message: str, context: dict = None) -> str:
        """
        Genera una respuesta del tutor a partir del mensaje del usuario.

        Args:
            message (str): Mensaje o consulta enviada por el estudiante.
            context (dict, optional): Información adicional (estado del estudiante,
                tema actual, historial de la conversación, etc.). Por defecto None.

        Returns:
            str: Respuesta generada por el modelo de lenguaje.

        Raises:
            NotImplementedError: Si la subclase no implementa este método.
        """
        pass

    @abstractmethod
    def name(self) -> str:
        """
        Retorna un identificador legible del modelo LLM concreto.

        Returns:
            str: Nombre del modelo (ej. "DialoGPT-RAG", "GPT-3.5 Turbo", etc.).
        """
        return "base"