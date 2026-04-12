from groq import Groq
import os
import re
import time
from dotenv import load_dotenv
import json

load_dotenv()


class DocumentComparator:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in .env")
        self.client = Groq(api_key=api_key)

    def _call_llm(self, prompt: str, retries: int = 3) -> str:
        """Single LLM call with retry on rate limit (429)."""
        for attempt in range(retries):
            try:
                response = self.client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[
                        {"role": "system", "content": "You are an expert tender document analyst. Return only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    timeout=60
                )
                return response.choices[0].message.content
            except Exception as e:
                if "rate_limit_exceeded" in str(e) or "429" in str(e):
                    wait = 30 * (attempt + 1)  # 30s, 60s, 90s
                    print(f"[LLM] Rate limit hit, waiting {wait}s before retry {attempt + 1}/{retries}...")
                    time.sleep(wait)
                else:
                    raise
        raise RuntimeError("LLM rate limit exceeded after all retries")

    def _parse_json(self, content: str) -> dict:
        """Strip markdown code fences if present, then parse JSON."""
        content = content.strip()
        # Remove ```json or ``` at start and ``` at end
        content = re.sub(r'^```(?:json)?\s*', '', content, flags=re.MULTILINE)
        content = re.sub(r'```\s*$', '', content, flags=re.MULTILINE)
        return json.loads(content.strip())

    def _build_context(self, chunks: list, label: str) -> str:
        """Build a readable context string from top retrieved chunks."""
        context = f"=== {label} ===\n"
        for chunk in chunks[:5]:
            context += f"{chunk['heading']}:\n{chunk['content'][:600]}\n\n"
        return context.strip()

    def compare_documents(self, query: str, chunks_a: list, chunks_b: list,
                          doc_name_a: str, doc_name_b: str) -> dict:
        """
        Compares two documents on a specific aspect/query.
        Retrieves relevant chunks from both and sends side-by-side to LLM.
        Returns structured comparison result.
        """
        context_a = self._build_context(chunks_a, doc_name_a)
        context_b = self._build_context(chunks_b, doc_name_b)

        prompt = f"""
You are comparing two tender documents on the following aspect: "{query}"

{context_a}

{context_b}

Return STRICT JSON only:
{{
  "aspect": "{query}",
  "document_a_name": "{doc_name_a}",
  "document_b_name": "{doc_name_b}",
  "similarities": [
    "Similarity point 1",
    "Similarity point 2",
    "Similarity point 3"
  ],
  "differences": [
    {{
      "aspect": "Sub-aspect or clause name",
      "document_a": "What Document A says about this",
      "document_b": "What Document B says about this"
    }}
  ],
  "document_a_advantage": "2-3 sentences on where Document A is stronger or more favorable",
  "document_b_advantage": "2-3 sentences on where Document B is stronger or more favorable",
  "recommendation": "3-4 sentence strategic recommendation — which document represents a better opportunity and why"
}}

Rules:
- Base your analysis ONLY on the provided context
- Be specific — reference actual clauses, numbers, or dates where present
- differences array must have at least 4 items
- No extra text outside JSON
"""
        try:
            content = self._call_llm(prompt)
            result = self._parse_json(content)
            return result
        except Exception as e:
            return {
                "aspect": query,
                "document_a_name": doc_name_a,
                "document_b_name": doc_name_b,
                "similarities": [],
                "differences": [],
                "document_a_advantage": "",
                "document_b_advantage": "",
                "recommendation": "Unable to generate comparison."
            }
