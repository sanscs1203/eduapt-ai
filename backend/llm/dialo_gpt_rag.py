# backend/llm/dialo_gpt_rag.py
# Implementación de un LLM ligero (DistilGPT2) con capacidades de RAG.
# Sirve como tutor conversacional, pero prioriza responder con recomendaciones
# o mensajes predefinidos según la intención detectada.

import torch
import re
from transformers import AutoModelForCausalLM, AutoTokenizer
from .base_llm import BaseLLM
import requests

class DialoGPTRAGLLM(BaseLLM):
    def __init__(self, rag_engine=None, model_name='distilgpt2'):
        """
        Inicializa el LLM.
        - rag_engine: instancia de RAGEngine (opcional, aunque no se usa explícitamente aquí)
        - model_name: modelo de Hugging Face (distilgpt2 es rápido y pequeño)
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.loaded = False
        self.rag_engine = rag_engine
        self.base_url = "http://127.0.0.1:5000"   # URL del backend para consultar /api/recommend

        self.system_prompt = (
            "Eres un tutor de álgebra que recomienda material de estudio. "
            "No resuelves problemas. Respuestas cortas (máx 20 palabras).\n"
        )

    def _load_model(self):
        """Carga el modelo y tokenizador en memoria (solo una vez)."""
        if self.loaded:
            return True
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            self.loaded = True
            print("DistilGPT2 cargado (más rápido)")
            return True
        except Exception as e:
            print(f"Error cargando modelo: {e}")
            return False

    def _detect_intent(self, message):
        """Detección simple de intención mediante palabras clave."""
        msg_lower = message.lower()
        if any(w in msg_lower for w in ['hola', 'buenas']):
            return "saludo"
        if any(w in msg_lower for w in ['gracias']):
            return "gracias"
        if any(w in msg_lower for w in ['recomienda', 'sugiere', 'material', 'recursos']):
            return "recomendar"
        if any(w in msg_lower for w in ['resolver', 'ecuación', 'inecuación', 'calcular']):
            return "fuera_tema"
        return None

    def _get_recommendations(self, uid, topic, S):
        """
        Llama al endpoint /api/recommend del propio backend para obtener recursos recomendados.
        Retorna un texto formateado con los títulos y URLs.
        """
        try:
            payload = {"uid": uid, "topic": topic, "S": S}
            resp = requests.post(f"{self.base_url}/api/recommend", json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                resources = data.get('resources', [])
                if resources:
                    texto = "📚 Recursos recomendados:\n"
                    for r in resources[:2]:
                        texto += f"- {r['title']}: {r['url']}\n"
                    return texto
                return "No hay recursos para ese tema. Prueba seleccionando otro."
            return "No pude obtener recomendaciones."
        except Exception as e:
            return "Error al consultar recursos."

    def generate(self, message, context=None):
        """
        Genera una respuesta basada en la intención detectada.
        Si es saludo, gracias, fuera_tema o recomendación, responde con mensajes fijos o llamada a /recommend.
        Si no, intenta generar texto con el modelo (como fallback).
        """
        uid = context.get('uid') if context else None
        topic = context.get('topic') if context else 'polinomios'
        S = context.get('S') if context else None

        intent = self._detect_intent(message)
        if intent == "saludo":
            return "¡Hola! Selecciona un tema en la barra lateral para que te recomiende material."
        if intent == "gracias":
            return "¡De nada! Practica con los ejercicios adaptativos."
        if intent == "fuera_tema":
            return "No resuelvo ejercicios. Solo recomiendo recursos según tu desempeño. Elige un tema para empezar."
        if intent == "recomendar":
            if uid and topic:
                return self._get_recommendations(uid, topic, S)
            else:
                return "Para recomendarte, primero elige un tema de la barra lateral."

        # Si no se detectó intención especial, usar el modelo generativo (DistilGPT2)
        if not self._load_model():
            return "No puedo responder ahora. Selecciona un tema para practicar."

        prompt = f"{self.system_prompt}Usuario: {message}\nTutor:"
        inputs = self.tokenizer(prompt, return_tensors='pt', truncation=True, max_length=256)
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids=inputs['input_ids'],
                attention_mask=inputs['attention_mask'],
                max_new_tokens=30,
                do_sample=True,
                temperature=0.8,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.5
            )
        response = self.tokenizer.decode(outputs[0][inputs['input_ids'].shape[-1]:], skip_special_tokens=True)
        response = response.strip()
        if not response:
            response = "¿En qué tema te gustaría practicar? Puedes elegir de la barra lateral."
        return response[:200]   # Limitar longitud

    def name(self):
        """Identificador del modelo usado (para logs)."""
        return "Tutor rápido"