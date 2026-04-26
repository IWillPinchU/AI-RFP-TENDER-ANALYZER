from groq import Groq
import os
import re
import time
import json
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()


class QuestionGenerator:
    """
    Generates relevant Q&A questions for a tender document.
    Groups all chunks by their pre-assigned category, takes the top 10 chunks
    per category, then makes a single LLM call requesting 2 questions per category.
    Result is a flat list of question strings (typically 10-14 questions).
    """

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in .env")
        self.client = Groq(api_key=api_key)

    def _call_llm(self, prompt: str, retries: int = 3) -> str:
        """Single LLM call with exponential backoff on rate limit (429)."""
        for attempt in range(retries):
            try:
                response = self.client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert tender document analyst. Return only JSON."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    timeout=60
                )
                return response.choices[0].message.content
            except Exception as e:
                if "rate_limit_exceeded" in str(e) or "429" in str(e):
                    wait = 30 * (attempt + 1)  
                    print(f"[QA] Rate limit hit, waiting {wait}s before retry {attempt + 1}/{retries}...")
                    time.sleep(wait)
                else:
                    raise
        raise RuntimeError("LLM rate limit exceeded after all retries")

    def _parse_json(self, content: str) -> dict:
        """Strip markdown code fences if present, then parse JSON."""
        content = content.strip()
        content = re.sub(r'^```(?:json)?\s*', '', content, flags=re.MULTILINE)
        content = re.sub(r'```\s*$', '', content, flags=re.MULTILINE)
        return json.loads(content.strip())

    def _build_context(self, by_category: dict) -> str:
        """
        Builds a single condensed context string from the top 10 chunks
        of each category. Limits each chunk content to 400 chars to stay
        well within token limits for a single LLM call.
        """
        context = ""
        for category, chunks in by_category.items():
            context += f"\n=== {category} ===\n"
            for chunk in chunks[:10]:
                heading = chunk.get("heading", "")
                content = chunk.get("content", "")[:400]
                context += f"{heading}:\n{content}\n\n"
        return context.strip()

    def generate_questions(self, all_chunks: list) -> list:
        """
        Main entry point. Groups chunks by category, builds condensed context,
        and makes a single LLM call to generate 2 specific questions per category.

        Returns a flat list of question strings.
        """
        
        by_category = defaultdict(list)
        for chunk in all_chunks:
            cat = chunk.get("category", "General")
            by_category[cat].append(chunk)

        context = self._build_context(by_category)
        categories_listed = ", ".join(by_category.keys())

        prompt = f"""
You are an expert tender analyst reviewing a tender document.
The document has been segmented into the following categories: {categories_listed}.

Below is the content extracted from each category (top clauses per section):

{context}

Your task: Generate exactly 2 specific, answerable questions per category that a
bidder would need to understand before submitting a proposal.

Requirements:
- Questions must be specific to THIS document (include actual numbers, dates, or terms where visible)
- Each question must be answerable from the provided content
- Do NOT generate generic questions — they must reflect actual content
- Cover the topic of each category (eligibility, financials, deadlines, legal risk, etc.)

Return STRICT JSON only:
{{
  "questions": [
    "Question 1 (from category 1)?",
    "Question 2 (from category 1)?",
    "Question 3 (from category 2)?",
    ...
  ]
}}

Rules:
- Flat list of all questions — no category grouping in the output
- Exactly 2 questions per category that has content
- No extra text outside JSON
- Output must be valid JSON
"""

        try:
            content = self._call_llm(prompt)
            result = self._parse_json(content)
            questions = result.get("questions", [])
            if not isinstance(questions, list):
                raise ValueError("LLM did not return a list of questions")
            return [q.strip() for q in questions if q.strip()]
        except Exception as e:
            print(f"[QA] Question generation failed: {type(e).__name__}: {e}")
            
            return [
                "What are the eligibility requirements for this tender?",
                "What is the submission deadline and format?",
                "What are the key financial requirements or cost structures?",
                "What are the main technical deliverables?",
                "What are the contract terms and penalty clauses?",
                "What compliance or certification requirements apply?"
            ]
