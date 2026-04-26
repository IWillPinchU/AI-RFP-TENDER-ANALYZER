import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import {
  Loader2,
  Zap,
  Trash2,
  Printer,
  Check,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { Document } from '@/types/document.types';
import type { Proposal } from '@/types/proposal.types';
import { PROPOSAL_SECTIONS } from '@/types/proposal.types';
import { proposalService } from '@/services/proposalService';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog';
import styles from './ProposalPage.module.css';

interface OutletContext {
  document: Document;
}

export function ProposalPage() {
  const { document } = useOutletContext<OutletContext>();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [isLoadingViewer, setIsLoadingViewer] = useState(false);

  const [title, setTitle] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (document.aiStatus === 'INDEXED') {
      loadProposals();
    } else {
      setIsLoadingList(false);
    }
  }, [document.id, document.aiStatus]);

  async function loadProposals() {
    setIsLoadingList(true);
    try {
      const list = await proposalService.listProposals(document.id);
      setProposals(list);
    } catch {
      setProposals([]);
    } finally {
      setIsLoadingList(false);
    }
  }

  function toggleChipSection(section: string) {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }

  async function handleGenerate() {
    if (!title.trim()) { setError('Enter a proposal title.'); return; }
    if (selectedSections.length === 0) { setError('Select at least one section.'); return; }

    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await proposalService.generateProposal({
        documentId: document.id,
        title: title.trim(),
        sections: selectedSections,
      });
      setSuccessMsg(`"${result.title}" generated!`);
      setActiveProposal(result);
      
      const defaultOpen: Record<string, boolean> = {};
      result.sections?.forEach((s, i) => { defaultOpen[s.id ?? String(i)] = true; });
      setOpenSections(defaultOpen);
      setTitle('');
      setSelectedSections([]);
      loadProposals();
    } catch (err: any) {
      setError(err?.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSelectProposal(proposalId: string) {
    if (activeProposal?.id === proposalId) return;
    setIsLoadingViewer(true);
    try {
      const full = await proposalService.getProposal(proposalId);
      setActiveProposal(full);
      
      const defaultOpen: Record<string, boolean> = {};
      full.sections?.forEach((s, i) => { defaultOpen[s.id ?? String(i)] = true; });
      setOpenSections(defaultOpen);
    } catch {
      setError('Failed to load proposal.');
    } finally {
      setIsLoadingViewer(false);
    }
  }

  function requestDelete(proposalId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setProposalToDelete(proposalId);
  }

  async function confirmDelete() {
    if (!proposalToDelete) return;
    try {
      await proposalService.deleteProposal(proposalToDelete);
      if (activeProposal?.id === proposalToDelete) setActiveProposal(null);
      setProposalToDelete(null);
      loadProposals();
    } catch {
      setError('Failed to delete proposal.');
      setProposalToDelete(null);
    }
  }

  if (document.aiStatus !== 'INDEXED') {
    return (
      <div className={styles.centerState}>
        <p>Document is still processing. Proposals require an indexed document.</p>
      </div>
    );
  }

  if (isLoadingList) {
    return (
      <div className={styles.centerState}>
        <Loader2 size={32} className={styles.spin} />
        <p>Loading proposals...</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.page} ${sidebarOpen ? styles.withSidebar : ''}`}>
        {}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>New Proposal</h3>
          </div>

          <div className={styles.formBody}>
            <div>
              <div className={styles.fieldLabel}>TITLE</div>
              <input
                className={styles.titleInput}
                type="text"
                placeholder="e.g. Tender Response — Project X"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div>
              <div className={styles.fieldLabel}>SECTIONS</div>
              <div className={styles.chipsGrid}>
                {PROPOSAL_SECTIONS.map((section) => {
                  const isSelected = selectedSections.includes(section);
                  return (
                    <button
                      key={section}
                      className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleChipSection(section)}
                      disabled={isGenerating}
                      type="button"
                    >
                      <span className={styles.chipCheck}>
                        {isSelected && <Check size={9} color="white" />}
                      </span>
                      {section}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 size={14} className={styles.spin} /> Generating {selectedSections.length} sections...</>
              ) : (
                <><Zap size={14} /> Generate Proposal</>
              )}
            </button>

            {error && <div className={styles.errorMsg}>{error}</div>}
            {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
          </div>
        </div>

        <div className={styles.middlePanel}>
          {}
          <div className={styles.viewerHeader}>
            <div className={styles.viewerTitleGroup}>
              {activeProposal ? (
                <>
                  <h3 className={styles.viewerTitle}>{activeProposal.title}</h3>
                  <span className={styles.viewerMeta}>
                    {activeProposal.documentName} • {new Date(activeProposal.createdAt).toLocaleString()}
                  </span>
                </>
              ) : (
                <h3 className={styles.viewerTitle}>Proposal Viewer</h3>
              )}
            </div>
            <div className={styles.viewerActions}>
              {activeProposal && (
                <button className={styles.btn} onClick={() => window.print()}>
                  <Printer size={14} /> Export PDF
                </button>
              )}
              <button
                className={styles.btn}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                {sidebarOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              </button>
            </div>
          </div>

          {}
          <div className={styles.viewerBody}>
            {isLoadingViewer ? (
              <div className={styles.loadingViewer}>
                <Loader2 size={28} className={styles.spin} />
                <p>Loading proposal...</p>
              </div>
            ) : activeProposal ? (
              activeProposal.sections && activeProposal.sections.length > 0 ? (
                activeProposal.sections.map((section, i) => {
                  const key = section.id ?? String(i);
                  const isOpen = openSections[key] !== false;
                  return (
                    <div key={key} className={styles.sectionCard}>
                      <div
                        className={styles.sectionCardHeader}
                        onClick={() => toggleSection(key)}
                      >
                        <h4 className={styles.sectionCardTitle}>{section.sectionTitle}</h4>
                        <ChevronDown
                          size={16}
                          className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ''}`}
                        />
                      </div>
                      <div className={`${styles.sectionAccordion} ${isOpen ? styles.sectionAccordionOpen : ''}`}>
                        <div className={styles.sectionAccordionContent}>
                          <div className={styles.sectionAccordionInner}>
                            <ul className={styles.pointsList}>
                              {section.points?.map((point, j) => (
                                <li key={j} className={styles.pointItem}>
                                  <span className={styles.bulletDash}>—</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyList}>No sections in this proposal.</div>
              )
            ) : (
              <div className={styles.emptyViewer}>
                <FileText size={40} style={{ opacity: 0.2 }} />
                <p>
                  {proposals.length > 0
                    ? 'Select a proposal from the sidebar to view its contents.'
                    : 'Generate your first proposal using the form on the left.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className={styles.rightPanel}>
          <div className={styles.sidebarHeader}>
            <div>
              <span className={styles.sidebarTitle}>History</span>
              <span className={styles.sidebarCount}> · {proposals.length}</span>
            </div>

          </div>

          <div className={styles.proposalsList}>
            {proposals.length === 0 ? (
              <div className={styles.emptyList}>
                No proposals yet. Use the generator to create one.
              </div>
            ) : (
              proposals.map((p) => (
                <div
                  key={p.id}
                  className={`${styles.proposalCard} ${activeProposal?.id === p.id ? styles.active : ''}`}
                  onClick={() => handleSelectProposal(p.id)}
                >
                  <div className={styles.proposalInfo}>
                    <span className={styles.proposalName}>{p.title}</span>
                    <span className={styles.proposalMeta}>
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => requestDelete(p.id, e)}
                    title="Delete proposal"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!proposalToDelete}
        title="Delete this proposal?"
        message={
          <>
            Are you sure you want to delete this proposal?<br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setProposalToDelete(null)}
      />
    </>
  );
}
