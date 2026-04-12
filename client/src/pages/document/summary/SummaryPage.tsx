import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Printer, RefreshCw, Zap, AlertCircle, TrendingUp, ChevronDown } from 'lucide-react';
import type { Document } from '@/types/document.types';
import type { DocumentSummaryResponse } from '@/types/summary.types';
import { summaryService } from '@/services/summaryService';
import styles from './SummaryPage.module.css';

// Survives component remounts — stores in-flight generation promises keyed by documentId
const pendingGenerations = new Map<string, Promise<DocumentSummaryResponse>>();

interface OutletContext {
  document: Document;
}

const DOT_COLORS: Record<string, string> = {
  'Eligibility': '#22c55e',
  'Technical': '#3b82f6',
  'Legal': '#ef4444',
  'Financial': '#f59e0b',
  'Security': '#8b5cf6',
  'General': '#767d88'
};

function RiskGauge({ risk }: { risk: 'Low' | 'Medium' | 'High' }) {
  const color = risk === 'Low' ? 'var(--color-success, #22c55e)' : 
                risk === 'Medium' ? 'var(--color-warning, #f59e0b)' : 
                'var(--color-error, #ef4444)';
  
  // Calculate stroke dash array for a half circle
  const strokeWidth = 14;
  const radius = 60;
  const dashArray = Math.PI * radius;
  
  return (
    <div className={styles.gaugeCard}>
      <div className={styles.gaugeHeader}>
        <AlertCircle size={14} /> ESTIMATED RISK
      </div>
      <div className={styles.gaugeBody} style={{ marginTop: 'auto', marginBottom: 'auto' }}>
        <svg viewBox="0 0 160 100" width="100%" height="auto" style={{ maxWidth: '220px', display: 'block', margin: '0 auto' }}>
          {/* Background Arc */}
          <path 
            className={styles.gaugeBgArc}
            d="M 20 70 A 60 60 0 0 1 140 70" 
            fill="none" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
          />
          {/* Colored Arc */}
          <path 
            d="M 20 70 A 60 60 0 0 1 140 70" 
            fill="none" 
            stroke={color} 
            strokeWidth={strokeWidth} 
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={0}
          />
          <text 
            x="80" 
            y="62" 
            textAnchor="middle" 
            fill={color} 
            fontSize="18"
            fontWeight="500"
            fontFamily="var(--font-display)"
          >
            {risk}
          </text>
          {/* Internal Labels correctly stationed under the arc bounds */}
          <text x="20" y="95" textAnchor="middle" className={styles.svgLabel} fontSize="11">Low</text>
          <text x="80" y="95" textAnchor="middle" className={styles.svgLabel} fontSize="11">Medium</text>
          <text x="140" y="95" textAnchor="middle" className={styles.svgLabel} fontSize="11">High</text>
        </svg>
      </div>
    </div>
  );
}

function ProbabilityBar({ probability }: { probability: number }) {
  return (
    <div className={styles.gaugeCard}>
      <div className={styles.gaugeHeader}>
        <TrendingUp size={14} /> WIN PROBABILITY
      </div>
      <div className={styles.probBody}>
        <div className={styles.probValue}>{probability.toFixed(1)}%</div>
        <div className={styles.probTrack}>
           <div className={styles.probFill} style={{ width: `${probability}%` }}></div>
        </div>
        <div className={styles.probLabels}>
           <span>0%</span> <span>50%</span> <span>100%</span>
        </div>
      </div>
    </div>
  );
}

export function SummaryPage() {
  const { document } = useOutletContext<OutletContext>();
  const [summary, setSummary] = useState<DocumentSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Accordion state - allows multiple to be open
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (document.aiStatus !== 'INDEXED') {
      setIsLoading(false);
      return;
    }

    // If a generation is already in-flight for this document (user navigated away
    // mid-generation), reattach to the existing promise instead of loading stale data.
    const pending = pendingGenerations.get(document.id);
    if (pending) {
      setIsGenerating(true);
      setIsLoading(false);
      pending
        .then(data => { setSummary(data); })
        .catch(() => { setError('Generation failed.'); })
        .finally(() => {
          setIsGenerating(false);
          pendingGenerations.delete(document.id);
        });
      return;
    }

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await summaryService.getSummary(document.id);
        setSummary(data);
      } catch {
        setError('Failed to fetch summary data');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [document.id, document.aiStatus]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSummary(null); // clear stale summary immediately
    try {
      const promise = summaryService.generateSummary(document.id);
      pendingGenerations.set(document.id, promise);
      const data = await promise;
      setSummary(data);
      setOpenCategories({});
    } catch {
      setError('Failed to generate summary. This may take a while, please try again later.');
    } finally {
      setIsGenerating(false);
      pendingGenerations.delete(document.id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleCategory = (catName: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  if (document.aiStatus !== 'INDEXED') {
    return (
      <div className={styles.centerState}>
        <p>Document is still processing or failed to index. A summary cannot be generated yet.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.centerState}>
        <RefreshCw size={32} className={styles.spin} />
        <p>Loading summary...</p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className={styles.centerState}>
        <RefreshCw size={32} className={styles.spin} />
        <h2>Analyzing Document</h2>
        <p>Please wait while our models extract key insights, assess risk, and generate a comprehensive summary. This usually takes 15-30 seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centerState}>
        <div style={{ color: 'var(--color-error)' }}>{error}</div>
        <button className={styles.btn} onClick={handleGenerate}>Try Again</button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={styles.centerState}>
        <h2>Executive Summary</h2>
        <p>No summary has been generated for this document yet.</p>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleGenerate}>
          <Zap size={16} />
          Generate Summary
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.headerBox}>
        <div className={styles.titleGroup}>
          <h2>Executive Summary</h2>
          <p>{document.originalFilename}</p>
        </div>
        <div className={styles.actionGroup}>
          <button className={styles.btn} onClick={handlePrint} title="Export to PDF">
            <Printer size={16} /> Export PDF
          </button>
          <button className={styles.btn} onClick={handleGenerate}>
            <RefreshCw size={16} /> Regenerate
          </button>
        </div>
      </div>

      {/* ── Custom SVG Gauges ── */}
      <div className={styles.gaugesRow}>
        <RiskGauge risk={summary.estimatedRisk} />
        <ProbabilityBar probability={summary.winProbability} />
      </div>

      {/* ── Overall Recommendation ── */}
      <div>
        <div className={styles.sectionTitle}>OVERALL RECOMMENDATION</div>
        <div className={styles.recommendationCard}>
          {summary.overallRecommendation}
        </div>
      </div>

      {/* ── Executive Overview ── */}
      <div>
        <div className={styles.sectionTitle}>EXECUTIVE OVERVIEW</div>
        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Overview</h3>
          <div className={styles.blockText}>{summary.overview}</div>
        </div>
        <div className={styles.block} style={{ marginTop: 'var(--space-6)' }}>
          <h3 className={styles.blockTitle}>Tender Purpose</h3>
          <div className={styles.blockText}>{summary.tenderPurpose}</div>
        </div>
      </div>

      {/* ── Scopes & Limitations ── */}
      <div style={{ marginTop: 'var(--space-6)' }}>
        <div className={styles.sectionTitle}>SCOPE & LIMITATIONS</div>
        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Scope of Work</h3>
          {summary.scopeOfWork && summary.scopeOfWork.length > 0 ? (
            <ul className={styles.ulList} style={{ gap: 'var(--space-2)' }}>
              {summary.scopeOfWork.map((item, i) => (
                <li key={i} className={styles.liItem}><span className={styles.bulletDash}>—</span> <span>{item}</span></li>
              ))}
            </ul>
          ) : (
            <div className={styles.blockText}>No specific scope details extracted.</div>
          )}
        </div>
        <div className={styles.block} style={{ marginTop: 'var(--space-6)' }}>
          <h3 className={styles.blockTitle}>Critical Deadlines</h3>
          {summary.criticalDeadlines && summary.criticalDeadlines.length > 0 ? (
            <ul className={styles.ulList} style={{ gap: 'var(--space-2)' }}>
              {summary.criticalDeadlines.map((item, i) => (
                <li key={i} className={styles.liItem}><span className={styles.bulletDash}>—</span> <span>{item}</span></li>
              ))}
            </ul>
          ) : (
            <div className={styles.blockText}>No critical deadlines detected.</div>
          )}
        </div>
      </div>

      {/* ── Category Accordions ── */}
      <div>
        <div className={styles.sectionTitle}>CATEGORY ANALYSIS</div>
        <div className={styles.accordionList}>
          {Object.entries(summary.categories || {}).map(([catName, details]) => {
            const isOpen = openCategories[catName] || false;
            const dotColor = DOT_COLORS[catName] || '#767d88'; // fallback dot color

            return (
              <div key={catName} className={styles.accordionItem}>
                {/* Header (Always Visible) */}
                <div 
                  className={styles.accordionHeader} 
                  onClick={() => toggleCategory(catName)}
                >
                  <div className={styles.accordionTitleGroup}>
                    <div className={styles.accordionDot} style={{ backgroundColor: dotColor }} />
                    {catName}
                  </div>
                  <ChevronDown size={20} className={`${styles.accordionIcon} ${isOpen ? styles.open : ''}`} />
                </div>

                {/* Content (Expanded with CSS Transition) */}
                <div className={`${styles.accordionWrapper} ${isOpen ? styles.open : ''}`}>
                  <div className={styles.accordionContent}>
                    <div className={styles.accordionInnerPadding}>
                      {/* Intro paragraph */}
                    <div className={styles.catOverview}>
                      {details.section_overview}
                      {details.detailed_analysis && (
                        <span style={{ display: 'block', marginTop: 'var(--space-3)' }}>
                          {details.detailed_analysis}
                        </span>
                      )}
                    </div>

                    {/* Vertical Stack for Lists */}
                    <div className={styles.listsStack}>
                      {/* Top Column: Key Points */}
                      <div>
                        {details.key_points && details.key_points.length > 0 && (
                          <>
                            <div className={styles.colTitle}>KEY POINTS</div>
                            <ul className={styles.ulList}>
                              {details.key_points.map((pt, i) => (
                                <li key={i} className={styles.liItem}>
                                  <span className={styles.bulletDash}>—</span> 
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>

                      {/* Bottom Column: Action Items */}
                      <div>
                        {details.action_items && details.action_items.length > 0 && (
                          <>
                            <div className={styles.colTitle}>ACTION ITEMS</div>
                            <ul className={styles.ulList}>
                              {details.action_items.map((pt, i) => (
                                <li key={i} className={styles.liItem}>
                                  <span className={styles.bulletArrow}>→</span> 
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Risks Box */}
                    {details.risks_and_considerations && (
                      <div className={styles.riskBox}>
                        <div className={styles.riskTitle}>RISKS & CONSIDERATIONS</div>
                        <div className={styles.riskText}>{details.risks_and_considerations}</div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
