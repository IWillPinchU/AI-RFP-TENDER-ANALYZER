from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Directory where FAISS indexes and chunk lists are persisted
INDEX_DIR = os.getenv("INDEX_DIR", "indices")


class EmbeddingEngine:
    def __init__(self, model_name="BAAI/bge-small-en-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.indexes = {}      # doc_id -> faiss.Index (in-memory)
        self.chunks_map = {}   # doc_id -> list of chunk dicts (in-memory)

        # Ensure index directory exists
        os.makedirs(INDEX_DIR, exist_ok=True)

        # On startup — reload all previously saved indexes from disk
        self._reload_all_from_disk()

    def _index_path(self, doc_id: str) -> str:
        return os.path.join(INDEX_DIR, f"{doc_id}.faiss")

    def _chunks_path(self, doc_id: str) -> str:
        return os.path.join(INDEX_DIR, f"{doc_id}_chunks.json")

    def _reload_all_from_disk(self):
        """
        Called once on startup. Scans the indices/ directory and loads
        all previously saved FAISS indexes into memory.
        """
        loaded = 0
        for filename in os.listdir(INDEX_DIR):
            if filename.endswith(".faiss"):
                doc_id = filename.replace(".faiss", "")
                try:
                    self._load_from_disk(doc_id)
                    loaded += 1
                except Exception as e:
                    print(f"[EmbeddingEngine] Failed to reload index for {doc_id}: {e}")
        print(f"[EmbeddingEngine] Reloaded {loaded} index(es) from disk on startup.")

    def _load_from_disk(self, doc_id: str):
        """Load a single FAISS index + chunks from disk into memory."""
        index = faiss.read_index(self._index_path(doc_id))
        with open(self._chunks_path(doc_id), "r", encoding="utf-8") as f:
            chunks = json.load(f)
        self.indexes[doc_id] = index
        self.chunks_map[doc_id] = chunks

    def _save_to_disk(self, doc_id: str):
        """Persist a FAISS index + chunks to disk after building."""
        faiss.write_index(self.indexes[doc_id], self._index_path(doc_id))
        with open(self._chunks_path(doc_id), "w", encoding="utf-8") as f:
            json.dump(self.chunks_map[doc_id], f, ensure_ascii=False)

    def build_index(self, doc_id: str, chunks: list):
        """Build FAISS index for a doc, store in memory, and persist to disk."""
        texts = [chunk["content"] for chunk in chunks]
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        embeddings = np.array(embeddings, dtype="float32")

        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)

        self.indexes[doc_id] = index
        self.chunks_map[doc_id] = chunks

        # Persist to disk immediately so it survives restarts
        self._save_to_disk(doc_id)

        return len(chunks)

    def search(self, query: str, doc_id: str, top_k: int = 5):
        """Search only the index for a specific doc_id."""
        if doc_id not in self.indexes:
            raise ValueError(f"Document '{doc_id}' not loaded. Call /load first.")

        query_embedding = self.model.encode([query], normalize_embeddings=True)
        query_embedding = np.array(query_embedding, dtype="float32")

        scores, indices = self.indexes[doc_id].search(query_embedding, top_k)

        results = []
        chunks = self.chunks_map[doc_id]
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(chunks):
                results.append({**chunks[idx], "score": float(score)})

        return results

    def is_loaded(self, doc_id: str) -> bool:
        return doc_id in self.indexes

    def unload(self, doc_id: str):
        """
        Remove a doc's index from memory AND delete its files from disk.
        Called when a document is deleted by the user.
        """
        self.indexes.pop(doc_id, None)
        self.chunks_map.pop(doc_id, None)

        # Delete persisted files if they exist
        for path in [self._index_path(doc_id), self._chunks_path(doc_id)]:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"[EmbeddingEngine] Could not delete {path}: {e}")
