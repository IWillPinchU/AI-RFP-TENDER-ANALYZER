import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import {
  RefreshCw,
  Download,
  Play,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import type { Document } from '@/types/document.types';
import type { DocumentQAResponse, QAAnswerResponse } from '@/types/qa.types';
import { qaService } from '@/services/qaService';
import styles from './QAPage.module.css';

interface OutletContext {
  document: Document;
}

export function QAPage() {
  const { document } = useOutletContext<OutletContext>();

  const [qaData, setQaData] = useState<DocumentQAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected question
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Answers cache (keyed by question index)
  const [answers, setAnswers] = useState<Record<number, QAAnswerResponse>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── Load questions on mount ──
  useEffect(() => {
    if (document.aiStatus !== 'INDEXED') {
      setIsLoading(false);
      return;
    }
    loadQuestions();
  }, [document.id, document.aiStatus]);

  async function loadQuestions() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await qaService.getQuestions(document.id);
      setQaData(data);
    } catch (err) {
      setError('Failed to load questions.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    try {
      const data = await qaService.regenerateQuestions(document.id);
      setQaData(data);
      setSelectedIdx(null);
      setAnswers({});
    } catch (err) {
      setError('Failed to regenerate questions.');
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleAnalyze() {
    if (selectedIdx === null || !qaData) return;
    const question = qaData.questions[selectedIdx];
    if (answers[selectedIdx]) return; // already answered

    setIsAnalyzing(true);
    try {
      const answer = await qaService.getAnswer(document.id, question);
      setAnswers((prev) => ({ ...prev, [selectedIdx]: answer }));
    } catch (err) {
      setError('Failed to generate answer.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleDownload() {
    if (selectedIdx === null || !qaData) return;
    const question = qaData.questions[selectedIdx];
    const answer = answers[selectedIdx];
    if (!answer) return;

    // Build plain text content
    let content = `Q&A Export — ${document.originalFilename}\n`;
    content += `${'═'.repeat(60)}\n\n`;
    content += `QUESTION:\n${question}\n\n`;
    content += `ANSWER:\n`;
    answer.mainAnswer.forEach((pt, i) => {
      content += `  ${i + 1}. ${pt}\n`;
    });
    content += `\nCONCLUSION:\n${answer.conclusion}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `qa_${selectedIdx + 1}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Guard states ──
  if (document.aiStatus !== 'INDEXED') {
    return (
      <div className={styles.centerState}>
        <p>Document is still processing. Q&A requires an indexed document.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.centerState}>
        <Loader2 size={32} className={styles.spin} />
        <h2>Generating Questions</h2>
        <p>Analyzing your document to generate relevant questions. This may take a moment on first load.</p>
      </div>
    );
  }

  if (error && !qaData) {
    return (
      <div className={styles.centerState}>
        <div style={{ color: 'var(--color-error)' }}>{error}</div>
        <button className={styles.btnPrimary} onClick={loadQuestions}>
          Try Again
        </button>
      </div>
    );
  }

  if (!qaData || qaData.questions.length === 0) {
    return (
      <div className={styles.centerState}>
        <HelpCircle size={32} />
        <h2>Q&A</h2>
        <p>No questions have been generated yet.</p>
        <button className={styles.btnPrimary} onClick={loadQuestions}>
          Generate Questions
        </button>
      </div>
    );
  }

  const currentAnswer = selectedIdx !== null ? answers[selectedIdx] : null;
  const isAnswered = (idx: number) => !!answers[idx];

  return (
    <div className={styles.page}>
      {/* ── Left Panel: Questions ── */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Questions</span>
          <button
            className={styles.regenerateBtn}
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Regenerate questions"
          >
            <RefreshCw size={14} className={isRegenerating ? styles.spin : ''} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>

        <div className={styles.questionsList}>
          {qaData.questions.map((q, idx) => (
            <button
              key={idx}
              className={`${styles.questionItem} ${selectedIdx === idx ? styles.active : ''} ${isAnswered(idx) ? styles.answered : ''}`}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className={styles.questionDot} />
              <span className={styles.questionText}>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Answer ── */}
      <div className={styles.rightPanel}>
        {/* Action Bar */}
        <div className={styles.answerHeader}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}>
            {selectedIdx !== null
              ? `Question ${selectedIdx + 1} of ${qaData.questions.length}`
              : 'Select a question'}
          </span>
          <div className={styles.answerActions}>
            <button
              className={styles.actionBtn}
              disabled={selectedIdx === null || !currentAnswer}
              onClick={handleDownload}
            >
              <Download size={14} /> Download
            </button>
            <button
              className={`${styles.actionBtn} ${styles.analyzeBtn}`}
              disabled={selectedIdx === null || isAnalyzing || !!currentAnswer}
              onClick={handleAnalyze}
            >
              {isAnalyzing ? (
                <><Loader2 size={14} className={styles.spin} /> Analyzing...</>
              ) : (
                <><Play size={14} /> Analyze</>
              )}
            </button>
          </div>
        </div>

        {/* Answer Body */}
        <div className={styles.answerBody}>
          {selectedIdx === null ? (
            <div className={styles.emptyState}>
              <HelpCircle size={40} style={{ opacity: 0.3 }} />
              <p>Select a question from the left panel to view or generate its answer.</p>
            </div>
          ) : isAnalyzing ? (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spin} />
              <p>Generating answer...</p>
              <span>This may take a moment</span>
            </div>
          ) : currentAnswer ? (
            <>
              <h2 className={styles.selectedQuestion}>
                {qaData.questions[selectedIdx]}
              </h2>

              <div className={styles.answerSection}>
                <div className={styles.answerLabel}>ANSWER</div>
                <div className={styles.answerCard}>
                  <ul className={styles.answerList}>
                    {currentAnswer.mainAnswer.map((pt, i) => (
                      <li key={i} className={styles.answerItem}>
                        <span className={styles.bulletDash}>—</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.answerSection}>
                <div className={styles.answerLabel}>CONCLUSION</div>
                <div className={styles.answerCard}>
                  <div className={styles.conclusionText}>
                    {currentAnswer.conclusion}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <h2 className={styles.selectedQuestion} style={{ fontSize: 'var(--text-h4)', textAlign: 'center' }}>
                {qaData.questions[selectedIdx]}
              </h2>
              <p>Click <strong>Analyze</strong> to generate an AI-powered answer for this question.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
