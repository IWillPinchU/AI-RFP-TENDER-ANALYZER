class RetrievalEngine:
    def __init__(self, embedder):
        self.embedder = embedder

    def detect_intent(self, query: str) -> str:
        query_lower = query.lower()
        if any(w in query_lower for w in ["eligib", "qualif", "criteria", "requirement"]):
            return "eligibility"
        if any(w in query_lower for w in ["financial", "budget", "cost", "price", "payment"]):
            return "financial"
        if any(w in query_lower for w in ["legal", "compliance", "penalty", "clause"]):
            return "legal"
        if any(w in query_lower for w in ["technical", "specification", "scope", "deliverable"]):
            return "technical"
        if any(w in query_lower for w in ["security", "risk", "threat", "confidential"]):
            return "security"
        return "general"

    def score_result(self, result: dict, intent: str) -> float:
        base_score = result.get("score", 0)
        heading = result.get("heading", "").lower()
        category = result.get("category", "").lower()

        boost = 0
        if intent != "general":
            if intent in heading or intent in category:
                boost = 15

        return base_score + boost

    def retrieve(self, query: str, doc_id: str, top_k: int = 5) -> list:
        """Retrieve relevant chunks for a specific doc_id."""
        
        candidates = self.embedder.search(query, doc_id, top_k=top_k * 2)

        intent = self.detect_intent(query)

        
        scored = [(self.score_result(r, intent), r) for r in candidates]
        scored.sort(key=lambda x: x[0], reverse=True)

        return [r for _, r in scored[:top_k]]
