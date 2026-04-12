from groq import Groq
import os
import time
from dotenv import load_dotenv
from collections import defaultdict
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()


class DocumentSummarizer:
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
        content = re.sub(r'^```(?:json)?\s*', '', content, flags=re.MULTILINE)
        content = re.sub(r'```\s*$', '', content, flags=re.MULTILINE)
        return json.loads(content.strip())

    def _build_category_context(self, chunks: list) -> str:
        """Combine chunk headings + content into a single context string."""
        context = ""
        for chunk in chunks[:10]:  # max 10 chunks per category
            context += f"{chunk['heading']}:\n{chunk['content'][:800]}\n\n"
        return context.strip()

    def _summarize_category(self, category: str, chunks: list) -> dict:
        """
        Generate a detailed multi-paragraph summary for a single category.
        Targets ~300-400 words per category output.
        """
        context = self._build_category_context(chunks)
        prompt = f"""
You are writing a detailed section of a tender analysis report for the {category} category.

Context extracted from the tender document:
{context}

Return STRICT JSON only:
{{
  "section_overview": "A 3-4 sentence paragraph introducing the {category} aspects of this tender",
  "detailed_analysis": "A 4-6 sentence paragraph with deeper analysis of requirements, conditions, and implications",
  "key_points": [
    "Specific point 1 with detail",
    "Specific point 2 with detail",
    "Specific point 3 with detail",
    "Specific point 4 with detail",
    "Specific point 5 with detail",
    "Specific point 6 with detail",
    "Specific point 7 with detail",
    "Specific point 8 with detail"
  ],
  "risks_and_considerations": "2-3 sentences about specific risks or things to watch out for in this category",
  "action_items": ["Action 1 for bidder", "Action 2 for bidder", "Action 3 for bidder"]
}}

Rules:
- Use only the provided context
- Be specific — reference actual numbers, dates, clauses where present
- key_points must have at least 6-8 items with real detail
- No generic filler — every sentence must add value
- No extra text outside JSON
"""
        try:
            content = self._call_llm(prompt)
            result = self._parse_json(content)
            return result
        except Exception as e:
            print(f"[summarize] Failed '{category}': {type(e).__name__}: {e}")
            return {
                "section_overview": f"Unable to summarize {category} section.",
                "detailed_analysis": "",
                "key_points": [],
                "risks_and_considerations": "",
                "action_items": []
            }

    def summarize_document(self, all_chunks: list) -> dict:
        """
        Main entry point. Groups chunks by category, summarizes each in detail,
        then generates a final executive overview. Max 7 LLM calls.
        Target output: ~2000 words (~4-5 pages).
        """
        # Group chunks by category
        by_category = defaultdict(list)
        for chunk in all_chunks:
            cat = chunk.get("category", "General")
            by_category[cat].append(chunk)

        # Summarize all categories in parallel (one thread per category)
        category_summaries = {}
        with ThreadPoolExecutor() as executor:
            future_to_category = {
                executor.submit(self._summarize_category, category, chunks): category
                for category, chunks in by_category.items()
                if chunks
            }
            for future in as_completed(future_to_category):
                category = future_to_category[future]
                category_summaries[category] = future.result()

        # Build overview context from category section_overviews
        overview_context = ""
        for cat, summary in category_summaries.items():
            overview_context += f"{cat}: {summary.get('section_overview', '')}\n"

        # Final executive overview — 1 LLM call
        overview_prompt = f"""
You are writing the executive summary section of a professional tender analysis report.

Category summaries:
{overview_context}

Return STRICT JSON only:
{{
  "overview": "A comprehensive 8-10 sentence executive summary covering: what this tender is about, who can bid, key requirements, financial scope, timeline, and overall strategic assessment",
  "tender_purpose": "2-3 sentences describing what the contracting authority wants to achieve",
  "scope_of_work": ["Major deliverable 1", "Major deliverable 2", "Major deliverable 3", "Major deliverable 4"],
  "critical_deadlines": ["Deadline with date/detail 1", "Deadline with date/detail 2", "Deadline with date/detail 3"],
  "eligibility_highlights": ["Key eligibility requirement 1", "Key eligibility requirement 2", "Key eligibility requirement 3"],
  "estimated_risk": "Low | Medium | High",
  "overall_recommendation": "A 3-4 sentence strategic recommendation on whether and how to pursue this tender"
}}

Rules:
- Be comprehensive but precise
- Reference specific details from the summaries where available
- No extra text outside JSON
"""
        try:
            overview_content = self._call_llm(overview_prompt)
            overview_result = self._parse_json(overview_content)
        except Exception:
            overview_result = {
                "overview": "Unable to generate executive overview.",
                "tender_purpose": "",
                "scope_of_work": [],
                "critical_deadlines": [],
                "eligibility_highlights": [],
                "estimated_risk": "Unknown",
                "overall_recommendation": ""
            }

        return {
            "overview": overview_result,
            "categories": category_summaries
        }
