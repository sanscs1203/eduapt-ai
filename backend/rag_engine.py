# backend/rag_engine.py
import os
import chromadb
from sentence_transformers import SentenceTransformer
from chromadb.utils import embedding_functions

class RAGEngine:
    def __init__(self, persist_directory="./chroma_db"):
        # Asegurar que el directorio exista
        os.makedirs(persist_directory, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=persist_directory)
        self.collection_name = "algebra_tutor"
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        # Usar la misma función de embedding para colección
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name='all-MiniLM-L6-v2')
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_fn
        )
        print(f"✅ Motor RAG iniciado. Colección '{self.collection_name}' lista.")

    def index_questions(self, questions_data):
        """Indexa todas las preguntas del banco en ChromaDB (fuerza reindexación)."""
        ids = []
        documents = []
        metadatas = []
        for topic, questions in questions_data.items():
            for q in questions:
                doc_id = f"{topic}_{q['id']}"
                # Contenido del documento: topic + pregunta + respuesta
                doc_content = f"Tema: {topic}. Pregunta: {q['question']} Respuesta: {q['answer']}"
                doc_metadata = {
                    "topic": topic,
                    "question_id": q['id'],
                    "answer": q['answer'],
                    "difficulty": q.get('difficulty', 'Media'),
                    "link": q.get('link', '')
                }
                ids.append(doc_id)
                documents.append(doc_content)
                metadatas.append(doc_metadata)
        if ids:
            # Eliminar si ya existían (para evitar duplicados al reiniciar)
            try:
                existing = self.collection.get(ids=ids)
                if existing['ids']:
                    self.collection.delete(ids=existing['ids'])
            except:
                pass
            # Agregar nuevos
            self.collection.add(ids=ids, documents=documents, metadatas=metadatas)
            print(f"✅ {len(ids)} preguntas indexadas en ChromaDB correctamente.")
        else:
            print("⚠️ No hay preguntas para indexar.")

    def index_questions_if_empty(self, questions_data):
        """
        Indexa SOLO si la colección está vacía.
        Esto evita la regeneración de embeddings en cada reinicio del servidor.
        """
        existing_count = self.collection.count()
        if existing_count > 0:
            print(f"ℹ️ La colección ya contiene {existing_count} documentos. No se re-indexa.")
            return
        # Si está vacía, recién indexamos
        print(f"🔄 Colección vacía. Indexando {sum(len(qs) for qs in questions_data.values())} preguntas...")
        self.index_questions(questions_data)

    def retrieve_context(self, query, n_results=2):
        """
        Busca los documentos más relevantes para la consulta.
        Retorna una lista de diccionarios con 'document' y 'metadata'.
        """
        if not query or not query.strip():
            return []
        try:
            results = self.collection.query(query_texts=[query], n_results=n_results)
            # results es {'documents': [[doc1, doc2,...]], 'metadatas': [[meta1,meta2,...]], 'distances': ...}
            docs_list = results.get('documents', [[]])[0]
            metas_list = results.get('metadatas', [[]])[0]
            if not docs_list:
                return []
            # Combinar documentos y metadatos
            context_items = []
            for doc, meta in zip(docs_list, metas_list):
                context_items.append({'document': doc, 'metadata': meta})
            return context_items
        except Exception as e:
            print(f"Error en retrieve_context: {e}")
            return []