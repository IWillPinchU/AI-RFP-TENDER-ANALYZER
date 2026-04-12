from fastapi import FastAPI
from pydantic import BaseModel
from core.ingestion import DocumentIngestion
from core.chunking import ClauseChunker
from core.embeddings import EmbeddingEngine
from core.retrieval import RetrievalEngine
from core.proposal import ProposalGenerator
from core.summarize import DocumentSummarizer
from core.compare import DocumentComparator
from core.qa import QuestionGenerator

app = FastAPI()

ingestion = DocumentIngestion()
chunker = ClauseChunker()
generator = ProposalGenerator()
summarizer = DocumentSummarizer()
comparator = DocumentComparator()
qa_generator = QuestionGenerator()

# Single shared EmbeddingEngine — stores all docs in memory keyed by doc_id
embedder = EmbeddingEngine()


class LoadRequest(BaseModel):
    file_path: str
    doc_id: str


class QueryRequest(BaseModel):
    query: str
    doc_id: str


class ProposalRequest(BaseModel):
    doc_id: str
    title: str

class SummarizeRequest(BaseModel):
    doc_id: str

class CompareRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str
    doc_name_a: str
    doc_name_b: str
    query: str

def compute_ml_risk_and_win(chunks: list) -> tuple:
    """
    Runs both ML models (risk_model + win_model) across ALL provided chunks.
    Returns (overall_risk: str, avg_win_probability: float 0.0-1.0).
    Risk is determined by majority: 2+ 'high' -> High, 1 'high' -> Medium, else -> Low.
    """
    risks = []
    wins = []
    for chunk in chunks:
        try:
            pred = generator.predictor.predict(chunk["content"])
            risks.append(pred["risk"].lower())
            wins.append(pred["win_probability"])  # raw 0-100 from win_model
        except Exception:
            pass

    avg_win = round((sum(wins) / len(wins)), 2) if wins else 0.0

    high_count = risks.count("high")
    if high_count >= 2:
        overall_risk = "High"
    elif high_count == 1:
        overall_risk = "Medium"
    elif risks:
        overall_risk = "Low"
    else:
        overall_risk = "Unknown"

    return overall_risk, avg_win


@app.get("/")
def root():
    return {"message": "Tender AI API is running"}


@app.post("/load")
def load_document(req: LoadRequest):
    try:
        text = ingestion.load_document(req.file_path)
        chunks = chunker.process(text)

        count = embedder.build_index(req.doc_id, chunks)

        return {
            "status": "success",
            "doc_id": req.doc_id,
            "chunks_indexed": count
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/query")
def query_rfp(req: QueryRequest):
    try:
        if not embedder.is_loaded(req.doc_id):
            return {"error": f"Document '{req.doc_id}' not loaded. Call /load first."}

        retriever = RetrievalEngine(embedder)
        results = retriever.retrieve(req.query, req.doc_id)
        answer = generator.generate_answer(req.query, results)

        return {
            "doc_id": req.doc_id,
            "query": req.query,
            "answer": answer
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/proposal")
def generate_proposal(req: ProposalRequest):
    try:
        if not embedder.is_loaded(req.doc_id):
            return {"error": f"Document '{req.doc_id}' not loaded. Call /load first."}

        retriever = RetrievalEngine(embedder)
        results = retriever.retrieve(req.title, req.doc_id)
        section = generator.generate_proposal_section(req.title, results)

        return {
            "doc_id": req.doc_id,
            "title": req.title,
            "section": section
        }
    except Exception as e:
        return {"error": str(e)}


@app.delete("/unload/{doc_id}")
def unload_document(doc_id: str):
    embedder.unload(doc_id)
    return {"status": "unloaded", "doc_id": doc_id}

@app.post("/summarize")
def summarize_document(req: SummarizeRequest):
    """
    Summarizes a document using category-based hierarchical summarization.
    ML models compute estimated_risk and win_probability across all chunks.
    Requires the document to have been loaded via /load first.
    """
    try:
        if not embedder.is_loaded(req.doc_id):
            return {"error": f"Document '{req.doc_id}' not loaded. Call /load first."}

        all_chunks = embedder.chunks_map.get(req.doc_id, [])
        if not all_chunks:
            return {"error": "No chunks found for this document."}

        # ML models run across ALL chunks for accurate document-level scores
        estimated_risk, win_probability = compute_ml_risk_and_win(all_chunks)

        # LLM generates the textual summary
        result = summarizer.summarize_document(all_chunks)

        return {
            "doc_id": req.doc_id,
            "summary": result,
            "estimated_risk": estimated_risk,
            "win_probability": win_probability
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/compare")
def compare_documents(req: CompareRequest):
    """
    Compares two documents on a specific aspect/query.
    ML models compute risk and win probability on the retrieved comparison chunks.
    Both documents must be loaded via /load first.
    """
    try:
        if not embedder.is_loaded(req.doc_id_a):
            return {"error": f"Document A '{req.doc_id_a}' not loaded. Call /load first."}
        if not embedder.is_loaded(req.doc_id_b):
            return {"error": f"Document B '{req.doc_id_b}' not loaded. Call /load first."}

        # Retrieve relevant chunks from both documents for the query
        retriever = RetrievalEngine(embedder)
        chunks_a = retriever.retrieve(req.query, req.doc_id_a, top_k=5)
        chunks_b = retriever.retrieve(req.query, req.doc_id_b, top_k=5)

        # ML models compute risk and win probability from the comparison-relevant chunks
        document_a_risk, document_a_win = compute_ml_risk_and_win(chunks_a)
        document_b_risk, document_b_win = compute_ml_risk_and_win(chunks_b)

        # LLM generates the structural comparison (similarities, differences, advantages, recommendation)
        result = comparator.compare_documents(
            req.query, chunks_a, chunks_b,
            req.doc_name_a, req.doc_name_b
        )

        return {
            "doc_id_a": req.doc_id_a,
            "doc_id_b": req.doc_id_b,
            "comparison": result,
            "document_a_risk": document_a_risk,
            "document_b_risk": document_b_risk,
            "document_a_win_probability": document_a_win,
            "document_b_win_probability": document_b_win
        }
    except Exception as e:
        return {"error": str(e)}


class QARequest(BaseModel):
    doc_id: str


@app.post("/generate-questions")
def generate_questions(req: QARequest):
    """
    Generates 2 specific questions per document category from the top 10 chunks
    of each category using a single LLM call.
    Requires the document to have been loaded via /load first.
    """
    try:
        if not embedder.is_loaded(req.doc_id):
            return {"error": f"Document '{req.doc_id}' not loaded. Call /load first."}

        all_chunks = embedder.chunks_map.get(req.doc_id, [])
        if not all_chunks:
            return {"error": "No chunks found for this document."}

        questions = qa_generator.generate_questions(all_chunks)

        return {
            "doc_id": req.doc_id,
            "questions": questions
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
def health():
    return {"status": "running", "loaded_docs": list(embedder.indexes.keys())}