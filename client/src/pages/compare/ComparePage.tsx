import { useState, useEffect, useCallback } from 'react';
import { FileText, ChevronRight, ChevronLeft, Trash2, BarChart2, Loader, Download, GitCompare, Plus, X, AlertCircle } from 'lucide-react';
import type { Document } from '@/types/document.types';
import type { DocumentComparison } from '@/types/compare.types';
import { documentService } from '@/services/documentService';
import { compareService } from '@/services/compareService';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog';
import styles from './ComparePage.module.css';

const PRESET_ASPECTS = [
  'Eligibility Criteria',
  'Financial Requirements',
  'Technical Specifications',
  'Legal & Compliance',
  'Risk Factors',
  'Pricing Structure',
  'Deliverables & Scope',
  'Timeline & Deadlines',
];

function RiskGauge({ risk, docName }: { risk: 'Low' | 'Medium' | 'High'; docName: string }) {
  const color = risk === 'Low' ? 'var(--color-success, #22c55e)'
              : risk === 'Medium' ? 'var(--color-warning, #f59e0b)'
              : 'var(--color-error, #ef4444)';
  const radius = 60;
  const dashArray = Math.PI * radius;
  return (
    <div className={styles.gaugeCard}>
      <div className={styles.gaugeCardHeader}>
        <FileText size={13} />
        <span className={styles.gaugeDocName}>{docName}</span>
      </div>
      <div className={styles.gaugeInner}>
        <div className={styles.gaugeLabel}>
          <AlertCircle size={12} /> ESTIMATED RISK
        </div>
        <svg viewBox="0 0 160 100" width="100%" height="auto" style={{ maxWidth: '200px', display: 'block', margin: '0 auto' }}>
          <path d="M 20 70 A 60 60 0 0 1 140 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
          <path d="M 20 70 A 60 60 0 0 1 140 70" fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
            strokeDasharray={dashArray} strokeDashoffset={0} />
          <text x="80" y="62" textAnchor="middle" fill={color} fontSize="18" fontFamily="var(--font-display)" fontWeight="500">{risk}</text>
          <text x="20" y="95" textAnchor="middle" fill="#c9ccd1" fontSize="11">Low</text>
          <text x="80" y="95" textAnchor="middle" fill="#c9ccd1" fontSize="11">Medium</text>
          <text x="140" y="95" textAnchor="middle" fill="#c9ccd1" fontSize="11">High</text>
        </svg>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ComparePage() {
  const [documents, setDocuments]               = useState<Document[]>([]);
  const [comparisons, setComparisons]           = useState<DocumentComparison[]>([]);
  const [active, setActive]                     = useState<DocumentComparison | null>(null);
  const [sidebarOpen, setSidebarOpen]           = useState(true);

  const [docIdA, setDocIdA]                     = useState('');
  const [docIdB, setDocIdB]                     = useState('');
  const [selectedAspect, setSelectedAspect]     = useState('');
  const [customAspect, setCustomAspect]         = useState('');
  const [useCustom, setUseCustom]               = useState(false);

  const [running, setRunning]                   = useState(false);
  const [error, setError]                       = useState('');
  const [deleteId, setDeleteId]                 = useState<number | null>(null);

  const loadComparisons = useCallback(async () => {
    try {
      const data = await compareService.listComparisons();
      setComparisons(data);
    } catch { setComparisons([]); }
  }, []);

  useEffect(() => {
    documentService.listDocuments()
      .then(docs => setDocuments(docs.filter(d => d.aiStatus === 'INDEXED')))
      .catch(() => setDocuments([]));
    loadComparisons();
  }, [loadComparisons]);

  const handleRun = async () => {
    const aspect = useCustom ? customAspect.trim() : selectedAspect;
    setError('');
    if (!docIdA || !docIdB)       return setError('Select both documents.');
    if (docIdA === docIdB)        return setError('Select two different documents.');
    if (!aspect)                  return setError('Select or enter a comparison aspect.');

    setRunning(true);
    try {
      const result = await compareService.runComparison({
        documentAId: docIdA,
        documentBId: docIdB,
        aspects: [aspect],
      });
      setActive(result);
      await loadComparisons();
    } catch (e: any) {
      setError(e.message || 'Comparison failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      const data = await compareService.getComparison(id);
      setActive(data);
    } catch { setError('Failed to load comparison.'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await compareService.deleteComparison(id);
      if (active?.id === id) setActive(null);
      setDeleteId(null);
      await loadComparisons();
    } catch { setError('Delete failed.'); }
  };

  const handleExportPDF = () => {
    if (!active) return;
    window.print();
  };


  return (
    <div className={styles.page}>
      {/* ── Top: Compare Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          {/* Doc A */}
          <div className={styles.pickerGroup}>
            <span className={styles.pickerLabel}>Document A</span>
            <div className={styles.selectWrap}>
              <FileText size={14} className={styles.selectIcon} />
              <select
                id="doc-a-select"
                className={styles.select}
                value={docIdA}
                onChange={e => setDocIdA(e.target.value)}
              >
                <option value="">Select document…</option>
                {documents
                  .filter(d => d.id !== docIdB)
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.originalFilename}</option>
                  ))}
              </select>
            </div>
          </div>

          <GitCompare size={18} className={styles.vsIcon} />

          {/* Doc B */}
          <div className={styles.pickerGroup}>
            <span className={styles.pickerLabel}>Document B</span>
            <div className={styles.selectWrap}>
              <FileText size={14} className={styles.selectIcon} />
              <select
                id="doc-b-select"
                className={styles.select}
                value={docIdB}
                onChange={e => setDocIdB(e.target.value)}
              >
                <option value="">Select document…</option>
                {documents
                  .filter(d => d.id !== docIdA)
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.originalFilename}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Aspects */}
          <div className={styles.aspectsGroup}>
            <span className={styles.pickerLabel}>Compare on</span>
            <div className={styles.chips}>
              {PRESET_ASPECTS.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`${styles.chip} ${!useCustom && selectedAspect === a ? styles.chipActive : ''}`}
                  onClick={() => { setSelectedAspect(a); setUseCustom(false); setCustomAspect(''); }}
                >
                  {a}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.chip} ${useCustom ? styles.chipActive : ''}`}
                onClick={() => { setUseCustom(true); setSelectedAspect(''); }}
              >
                <Plus size={12} /> Custom
              </button>
            </div>
            {useCustom && (
              <input
                className={styles.customInput}
                placeholder="Enter custom aspect…"
                value={customAspect}
                onChange={e => setCustomAspect(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div className={styles.divider} />

          {/* Run button */}
          <button
            id="run-compare-btn"
            className={styles.runBtn}
            onClick={handleRun}
            disabled={running}
          >
            {running
              ? <><Loader size={14} className={styles.spin} /> Comparing…</>
              : <><BarChart2 size={14} /> Compare</>}
          </button>
        </div>

        {error && (
          <div className={styles.errorBar}>
            <X size={12} /> {error}
          </div>
        )}
      </div>

      {/* ── Bottom: two-column layout ── */}
      <div className={`${styles.body} ${sidebarOpen ? styles.withSidebar : ''}`}>

        {/* Content column */}
        <div className={styles.contentPanel}>
          {/* Content header */}
          <div className={styles.contentHeader}>
            <div className={styles.contentHeaderLeft}>
              {active ? (
                <>
                  <h2 className={styles.contentTitle}>{active.query}</h2>
                  <span className={styles.contentMeta}>
                    {active.documentNameA} vs {active.documentNameB}
                    &ensp;·&ensp;
                    {formatDate(active.createdAt)}
                  </span>
                </>
              ) : (
                <h2 className={styles.contentTitle}>Comparison Results</h2>
              )}
            </div>
            <div className={styles.contentHeaderRight}>
              {active && (
                <button
                  id="export-pdf-btn"
                  className={styles.btn}
                  onClick={handleExportPDF}
                >
                  <Download size={13} /> Export PDF
                </button>
              )}
              <button
                id="sidebar-toggle-btn"
                className={styles.btn}
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? 'Hide history' : 'Show history'}
              >
                {sidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                History
              </button>
            </div>
          </div>

          {/* Content body */}
          <div className={styles.contentBody}>
            {running ? (
              <div className={styles.centerState}>
                <Loader size={32} className={styles.spin} />
                <p>Running comparison, this may take a moment…</p>
              </div>
            ) : !active ? (
              <div className={styles.centerState}>
                <GitCompare size={40} className={styles.emptyIcon} />
                <h3>No comparison selected</h3>
                <p>Select two documents, pick a comparison aspect, and hit Compare.</p>
              </div>
            ) : (
              <div className={styles.resultContent} id="compare-result">
                {/* Risk Gauge cards */}
                <div className={styles.gaugesRow}>
                  <RiskGauge risk={active.documentARisk} docName={active.documentNameA} />
                  <RiskGauge risk={active.documentBRisk} docName={active.documentNameB} />
                </div>

                {/* Recommendation */}
                {active.recommendation && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Recommendation</p>
                    <div className={styles.card}>
                      <p className={styles.bodyText}>{active.recommendation}</p>
                    </div>
                  </div>
                )}

                {/* Risk explanation */}
                {active.riskExplanation && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Risk Analysis</p>
                    <div className={styles.card}>
                      <p className={styles.bodyText}>{active.riskExplanation}</p>
                    </div>
                  </div>
                )}

                {/* Similarities */}
                {active.similarities?.length > 0 && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Similarities</p>
                    <div className={styles.card}>
                      <ul className={styles.bulletList}>
                        {active.similarities.map((s, i) => (
                          <li key={i} className={styles.bulletItem}>
                            <span className={styles.bullet}>—</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Differences */}
                {active.differences?.length > 0 && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Differences</p>
                    <div className={styles.diffTable}>
                      <div className={styles.diffHead}>
                        <span className={styles.diffAspectCell}>Aspect</span>
                        <span className={styles.diffDocCell}>
                          <FileText size={12} /> {active.documentNameA}
                        </span>
                        <span className={styles.diffDocCell}>
                          <FileText size={12} /> {active.documentNameB}
                        </span>
                      </div>
                      {active.differences.map((d, i) => (
                        <div key={i} className={`${styles.diffRow} ${i % 2 === 1 ? styles.diffRowAlt : ''}`}>
                          <span className={styles.diffAspectCell}>{d.aspect}</span>
                          <span className={styles.diffDocCell}>{d.documentA}</span>
                          <span className={styles.diffDocCell}>{d.documentB}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advantages */}
                {(active.documentAAdvantages?.length > 0 || active.documentBAdvantages?.length > 0 ||
                  (active as any).documentAAdvantage || (active as any).documentBAdvantage) && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Advantages</p>
                    <div className={styles.advantagesRow}>
                      <div className={styles.card}>
                        <p className={styles.advantageTitle}>{active.documentNameA}</p>
                        {active.documentAAdvantages?.length > 0
                          ? <ul className={styles.bulletList}>
                              {active.documentAAdvantages.map((a, i) => (
                                <li key={i} className={styles.bulletItem}><span className={styles.bullet}>—</span><span>{a}</span></li>
                              ))}
                            </ul>
                          : <p className={styles.bodyText}>{(active as any).documentAAdvantage}</p>
                        }
                      </div>
                      <div className={styles.card}>
                        <p className={styles.advantageTitle}>{active.documentNameB}</p>
                        {active.documentBAdvantages?.length > 0
                          ? <ul className={styles.bulletList}>
                              {active.documentBAdvantages.map((a, i) => (
                                <li key={i} className={styles.bulletItem}><span className={styles.bullet}>—</span><span>{a}</span></li>
                              ))}
                            </ul>
                          : <p className={styles.bodyText}>{(active as any).documentBAdvantage}</p>
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: history */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div>
              <p className={styles.sidebarTitle}>History</p>
              <p className={styles.sidebarCount}>{comparisons.length} comparison{comparisons.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className={styles.sidebarList}>
            {comparisons.length === 0 ? (
              <p className={styles.emptyList}>No comparisons yet.</p>
            ) : comparisons.map(c => (
              <div
                key={c.id}
                className={`${styles.historyCard} ${active?.id === c.id ? styles.historyCardActive : ''}`}
                onClick={() => handleView(c.id)}
              >
                <div className={styles.historyInfo}>
                  <p className={styles.historyQuery}>{c.query}</p>
                  <p className={styles.historyMeta}>
                    {c.documentNameA} vs {c.documentNameB}
                  </p>
                  <p className={styles.historyDate}>{formatDate(c.createdAt)}</p>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); setDeleteId(c.id); }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete comparison?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
