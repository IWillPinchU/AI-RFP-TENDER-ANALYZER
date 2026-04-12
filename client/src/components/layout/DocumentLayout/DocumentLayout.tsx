import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  HelpCircle,
  PenTool,
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { documentService } from '@/services/documentService';
import type { Document } from '@/types/document.types';
import { cn } from '@/utils/cn';
import styles from './DocumentLayout.module.css';

export function DocumentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDocument() {
      if (!id) return;
      setIsLoading(true);
      try {
        const docs = await documentService.listDocuments();
        const found = docs.find((d) => d.id === id);
        if (found) {
          setDocument(found);
        } else {
          console.error("Document not found");
        }
      } catch (err) {
        console.error("Failed to load document", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDocument();
  }, [id]);

  const tabs = [
    { name: 'Chat', path: 'chat', icon: MessageSquare },
    { name: 'Summary / Analysis', path: 'summary', icon: FileText },
    { name: 'Q&A', path: 'qa', icon: HelpCircle },
    { name: 'Proposals', path: 'proposals', icon: PenTool },
  ];

  if (isLoading) {
    return (
      <div className={styles.workspace}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Back to dashboard
          </button>
        </div>
        <div className={styles.contentArea} style={{ display: 'flex', justifyContent: 'center' }}>
          <div className={styles.loading}>
            <Loader2 size={32} className={styles.spin} />
            Loading Document Workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={styles.workspace}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Back to dashboard
          </button>
        </div>
        <div className={styles.contentArea}>
          <h3>Document not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.topBar}>
        <div className={styles.backRow}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Back to dashboard
          </button>
        </div>

        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{document.originalFilename}</h1>
            <div className={styles.metadataRow}>
              <span className={styles.metaItem}>
                <Layers size={14} /> {document.fileType} • {document.chunksIndexed || 0} chunks
              </span>
              <span className={styles.metaItem}>
                <Calendar size={14} /> 
                {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Indexed'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = location.pathname.includes(`/document/${document.id}/${tab.path}`);
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                className={cn(styles.tab, isActive && styles.tabActive)}
                onClick={() => navigate(`/document/${document.id}/${tab.path}`)}
              >
                <Icon size={16} className={styles.tabIcon} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.contentArea}>
        <div key={location.pathname} className={styles.contentInner}>
          <Outlet context={{ document }} />
        </div>
      </div>
    </div>
  );
}
