from transformers import AutoModelForCausalLM, AutoTokenizer
from .base_llm import BaseLLM

class DialoGPTLLM(BaseLLM):
    def __init__(self, model_name='microsoft/DialoGPT-small'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)

    def generate(self, message, context=None):
        new_input = self.tokenizer.encode(message + self.tokenizer.eos_token, return_tensors='pt')
        reply_ids = self.model.generate(new_input, max_length=100, pad_token_id=self.tokenizer.eos_token_id)
        return self.tokenizer.decode(reply_ids[:, new_input.shape[-1]:][0], skip_special_tokens=True)

    def name(self):
        return "DialoGPT-small"