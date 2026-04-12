from groq import Groq
import os
import time
from dotenv import load_dotenv
import json

from core.ingestion import DocumentIngestion
from core.chunking import ClauseChunker
from core.embeddings import EmbeddingEngine
from core.retrieval import RetrievalEngine
from ml.inference import Predictor


load_dotenv()


class ProposalGenerator:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError("GROQ_API_KEY not found in .env")

        self.client = Groq(api_key=api_key)
        self.predictor = Predictor()

    def _call_llm(self, system: str, prompt: str, temperature: float = 0.1, retries: int = 3) -> str:
        """LLM call with retry on rate limit (429)."""
        for attempt in range(retries):
            try:
                response = self.client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    timeout=60
                )
                return response.choices[0].message.content
            except Exception as e:
                if "rate_limit_exceeded" in str(e) or "429" in str(e):
                    wait = 30 * (attempt + 1)
                    print(f"[LLM] Rate limit hit, waiting {wait}s before retry {attempt + 1}/{retries}...")
                    time.sleep(wait)
                else:
                    raise
        raise RuntimeError("LLM rate limit exceeded after all retries")

    def clean_text(self, text: str) -> str:
        lines = text.split("\n")
        cleaned = []

        for line in lines:
            line = line.strip()

            if not line:
                continue

            line = line.replace("", "").strip()

            if len(line) < 3:
                continue

            cleaned.append(line)

        return "\n".join(cleaned)

    def build_context(self, retrieved_chunks):
        """Build a readable context string from the top retrieved chunks."""
        context = ""

        for chunk in retrieved_chunks[:4]:
            content = self.clean_text(chunk["content"])

            raw_lines = content.split("\n")
            lines = []
            buffer = ""

            for line in raw_lines:
                line = line.strip()
                if not line:
                    continue
                if line.endswith(".") or len(buffer) > 80:
                    buffer += " " + line
                    lines.append(buffer.strip())
                    buffer = ""
                else:
                    buffer += " " + line

            if buffer:
                lines.append(buffer.strip())

            lines = lines[:5]

            context += f"{chunk['heading']}:\n"
            for line in lines:
                context += f"- {line}\n"
            context += "\n"

        return context

    def generate_answer(self, query: str, retrieved_chunks):
        """Generate a structured answer for a chat query using retrieved document chunks."""
        if not retrieved_chunks:
            return {"error": "No relevant information found"}

        context = self.build_context(retrieved_chunks)

        prompt = f"""
You are an expert tender analysis system.

Context:
{context}

Question:
{query}

Return STRICT JSON only.

Format:
{{
  "main_answer": ["point1", "point2", "...at least 8-9 well-scored points"],
  "conclusion": "short insight"
}}

Rules:
- Use only given context
- No extra text
- No explanation
- Output must be valid JSON
"""

        content = self._call_llm("You return only JSON.", prompt, temperature=0.1)

        try:
            return json.loads(content)
        except:
            return {"raw_output": content}

    def generate_proposal_section(self, title: str, retrieved_chunks):
        context = self.build_context(retrieved_chunks)

        prompt = f"""
You are a professional tender proposal writer.

Generate section: {title}

Context:
{context}

Return STRICT JSON:

{{
  "title": "{title}",
  "points": ["point1", "point2", rate the points on score basis and points having higher score will get generated atleast 8 9 pointers]
}}

Rules:
- Use only context
- No assumptions
"""

        content = self._call_llm("You return only JSON.", prompt, temperature=0.2)

        try:
            return json.loads(content)
        except:
            return {"raw_output": content}


if __name__ == "__main__":
    ingestion = DocumentIngestion()
    chunker = ClauseChunker()
    embedder = EmbeddingEngine()
    retriever = RetrievalEngine(embedder)
    generator = ProposalGenerator()

    test_path = r"./pdf/Tendernotice_1.pdf"

    try:
        text = ingestion.load_document(test_path)
        chunks = chunker.process(text)

        embedder.build_index(chunks)

        query = "give a summary for this tender"

        retrieved = retriever.retrieve(query)

        answer = generator.generate_answer(query, retrieved)

        print(json.dumps(answer, indent=2, ensure_ascii=False))

    except Exception as e:
        print("Error:", str(e))