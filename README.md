# RFP Tender Intelligence System

A full-stack platform for analyzing government and corporate tender documents. Upload a PDF or DOCX, and the system handles everything — AI-powered chat, summaries, proposal drafts, document comparisons and an automated Q&A pipeline. Built for procurement teams and consultants who deal with a lot of tenders and don't have time to read everything twice.

---

## Tech Stack

**Backend (Java)**
- Spring Boot 4.0.5, Java 21
- Spring Security with JWT (access + refresh token rotation)
- Google OAuth2 login
- TOTP-based two-factor authentication
- Spring Data JPA + PostgreSQL
- Spring Mail for email verification and password reset flows

**AI / ML Service (Python)**
- FastAPI + Uvicorn
- FAISS for in-memory vector search (per-document index)
- sentence-transformers — BAAI/bge-small-en-v1.5 for embeddings
- Groq API (openai/gpt-oss-120b) for LLM generation
- scikit-learn RandomForest models for risk and win probability prediction
- pdfplumber, python-docx for document parsing

**Frontend**
- React 18 + Vite (TypeScript)
- React Router v6
- Zustand for global state
- Axios with JWT interceptors and automatic token refresh
- CSS Modules — no Tailwind

---

## Folder Structure

```
RFP/
├── rfp/                    Spring Boot backend (Java 21, Maven)
│   └── src/main/java/com/dce/rfp/
│       ├── config/         SecurityConfig, AsyncConfig
│       ├── controller/     Auth, User, Document, Chat, Summary, Proposal, Compare, QA
│       ├── service/        Business logic + AI bridge services
│       ├── entity/         JPA entities
│       ├── repository/     Spring Data repositories
│       ├── dto/            Request / Response DTOs
│       ├── security/       JWT filter, UserDetails, entry points
│       └── exception/      Custom exception handlers
│
├── rfpp/                   Python FastAPI microservice
│   ├── api.py              All AI endpoints
│   ├── core/               ingestion, chunking, embeddings, retrieval, summarize, compare, qa
│   ├── ml/                 feature_eng.py, training.py, inference.py
│   ├── models/             risk_model.pkl, win_model.pkl
│   └── data/               training_data_clean.csv
│
├── client/                 React + Vite frontend
│   └── src/
│       ├── components/     features/ (Settings), layout/, ui/
│       ├── pages/          auth/, dashboard/, document/, compare/, landing/, settings/
│       ├── services/       API service files per domain
│       ├── stores/         authStore, settingsStore, sidebarStore
│       ├── types/          TypeScript types per domain
│       └── styles/         tokens.css, global.css
│
└── uploads/                Uploaded documents stored here
```

---

## How to Run

You'll need three things running at the same time.

### 1. PostgreSQL
Make sure a PostgreSQL instance is up. Create a database and update the credentials in `spring-backend/src/main/resources/application.properties`.

### 2. Spring Boot Backend
```bash
cd spring-backend
./mvnw spring-boot:run
```
Runs on **http://localhost:8080**

### 3. Python AI Service
```bash
cd python-backend
pip install -r requirements.txt
uvicorn api:app --port 8000
```
Runs on **http://localhost:8000**

Make sure a `.env` file exists in `python-backend/` with:
```
GROQ_API_KEY=your_key_here
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173**

---

## What Was Built

### Authentication
- Email + password registration with email verification
- Login with optional two-factor authentication (TOTP via authenticator apps)
- Google OAuth2 login — users who sign in with Google can later set a password from their security settings
- JWT access tokens + refresh token rotation; all tokens invalidated on password change
- Forgot password + reset via email link
- Role-based access control

### Document Management
- Upload PDF, DOC or DOCX files
- Files stored on the filesystem; metadata tracked in PostgreSQL
- On upload, the Python service automatically extracts text, chunks it by heading, classifies each chunk into one of six categories (Financial, Eligibility, Security, Legal, Technical, General), generates embeddings and builds a FAISS index
- Status tracking: PENDING → INDEXED or FAILED
- Per-user isolation; deleting a document cleans up everything including its FAISS index

### Chat
- Every document gets its own persistent chat session
- Ask anything about the document in natural language
- Responses are structured — bullet points for the main answer and a short conclusion
- Full conversation history saved and retrievable

### Summary
- One-click AI summary per document
- Gives you: overview, tender purpose, scope of work, critical deadlines, eligibility highlights, overall recommendation
- Risk level (Low / Medium / High) and win probability (percentage) from ML models trained on historical tender data
- Results cached in the database so you don't burn API calls every time you open a doc; can be regenerated on demand
- Broken down by category (Financial, Eligibility, Security, Legal, Technical, General)

### Proposals
- Generate a full proposal draft for any indexed document
- Seven preset sections — executive summary, technical approach, team qualifications, project timeline, budget, risk management and compliance
- Each section generated independently so you can regenerate just the parts you don't like
- Save multiple named proposals per document; full CRUD + PDF export

### Document Comparison
- Pick any two indexed documents and compare them on eight preset aspects or write your own query
- AI returns similarities, per-aspect differences, advantages of each document and a recommendation
- Risk scores for both documents side by side
- Past comparisons saved as history; PDF export available

### Q&A
- Two questions auto-generated per category (12 total per document)
- Questions cached; won't regenerate unless you ask it to
- Click any question to get an AI answer pulled from the document
- Answers follow the same structured format as chat responses
- Full session-level caching and PDF export

### Settings
- Profile tab — shows your account info (read-only)
- Security tab:
  - Change password; OAuth users who haven't set a password get a "Set Password" flow instead (no current password required)
  - Enable 2FA — QR code appears in a mini-modal inside the settings panel; scan with your authenticator app then enter the code to confirm
  - Disable 2FA — confirmation code field expands inline inside the authenticator card

---

## AI Pipeline Overview

```
Document Upload
  → text extraction (pdfplumber / python-docx)
  → heading-based chunking
  → category classification (6 categories)
  → BAAI/bge-small-en-v1.5 embeddings
  → FAISS index stored per document id

Query
  → intent detection
  → FAISS semantic search
  → keyword overlap re-ranking
  → intent boost (+15 for category match)
  → top-5 chunks → Groq LLM
  → structured JSON response

ML Risk / Win Prediction
  → features extracted per chunk via feature_eng.py
  → RandomForest classifier → Low / Medium / High risk
  → RandomForest regressor → win probability 0–100%
  → majority vote / average across all chunks
```

---

## Notes

- Groq API key is required for any AI feature to work; without it the Python service will start but all generation endpoints will fail
- The three servers are fully independent and communicate over HTTP; you can restart any one of them without affecting the others
