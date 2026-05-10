from abc import ABC, abstractmethod

class BaseLLM(ABC):
    @abstractmethod
    def generate(self, message, context=None):
        """Genera una respuesta del tutor"""
        pass

    @abstractmethod
    def name(self):
        return "base"