from transformers import pipeline
from .base_llm import BaseLLM

class BertTemplateLLM(BaseLLM):
    def __init__(self):
        self.classifier = pipeline('text-classification', model='google/bert_uncased_L-2_H-128_A-2')
        self.templates = {
            'help': 'Puedo ayudarte a resolver problemas de álgebra. ¿Qué tema te gustaría practicar?',
            'greeting': '¡Hola! Soy EduAdapt AI, tu tutor inteligente.',
            'default': 'Selecciona un tema de la barra lateral o escribe el nombre.'
        }

    def generate(self, message, context=None):
        # Clasificar intención
        result = self.classifier(message)
        # Lógica simplificada: mapeo a plantillas
        msg_lower = message.lower()
        if any(w in msg_lower for w in ['ayuda', 'help', 'temas']):
            return self.templates['help']
        elif any(w in msg_lower for w in ['hola', 'hello', 'buenas']):
            return self.templates['greeting']
        return self.templates['default']

    def name(self):
        return "BERT-tiny + Plantillas"