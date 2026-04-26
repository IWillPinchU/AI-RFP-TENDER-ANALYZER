import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  UploadCloud,
  Search,
  Trash2,
  File as FileIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { documentService } from '@/services/documentService';
import type { Document } from '@/types/document.types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog';
import { cn } from '@/utils/cn';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async (isBackgroundPoll = false) => {
    if (!isBackgroundPoll) setIsLoading(true);
    try {
      const data = await documentService.listDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      if (!isBackgroundPoll) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  
  useEffect(() => {
    const pendingDocs = documents.some(doc => doc.aiStatus === 'PENDING');
    if (!pendingDocs) return;

    const timeoutId = setTimeout(() => {
      fetchDocuments(true); 
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [documents]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await documentService.uploadDocument(file);
      await fetchDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestDelete = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToDelete(docId);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await documentService.deleteDocument(docToDelete);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete));
      setDocToDelete(null);
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete document.');
      setDocToDelete(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasPending = documents.some(doc => doc.aiStatus === 'PENDING');
  const uploadDisabled = isUploading || hasPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.subtitle}>Upload and manage your RFP documents</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.actionsBox}>
          <button
            className={styles.refreshButton}
            onClick={() => fetchDocuments(false)}
            disabled={isLoading || uploadDisabled}
            aria-label="Refresh documents"
            title="Refresh"
          >
            <RefreshCw size={18} className={cn(isLoading && styles.spin)} />
          </button>
          
          <button
            className={styles.uploadButton}
            onClick={handleUploadClick}
            disabled={uploadDisabled}
          >
            {uploadDisabled ? <Loader2 size={18} className={styles.spin} /> : <UploadCloud size={18} />}
            <span>{isUploading ? 'Uploading...' : hasPending ? 'Indexing...' : 'Upload New'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className={styles.documentList}>
        {isLoading && documents.length === 0 ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className={styles.spin} color="#00f0ff" />
            <p>Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className={styles.emptyState}>
            <FileIcon size={48} color="#3f3f46" />
            <h3>No documents found</h3>
            <p>Upload a new tender document to get started.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isReady = doc.aiStatus === 'INDEXED';
            const isFailed = doc.aiStatus === 'FAILED';

            return (
              <div 
                key={doc.id} 
                className={cn(styles.docCard, !isReady && styles.docCardDisabled)}
                onClick={() => {
                  if (isReady) navigate(`/document/${doc.id}/chat`);
                }}
              >
                <div className={styles.docRow}>
                  <div className={styles.docInfo}>
                    <div className={styles.docIconWrapper}>
                      <FileIcon size={20} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <h3 className={styles.docName}>{doc.originalFilename}</h3>
                      <div className={styles.docMeta}>
                        <span>{doc.fileType || 'Unknown Type'}</span>
                        <span className={styles.dot}>•</span>
                        <span>{doc.chunksIndexed || 0} chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.docRight}>
                    <div className={styles.statusBadge}>
                      {isReady ? (
                        <div className={cn(styles.badge, styles.badgeSuccess)}>
                          <CheckCircle2 size={14} /> INDEXED
                        </div>
                      ) : isFailed ? (
                        <div className={cn(styles.badge, styles.badgeError)}>
                          <AlertTriangle size={14} /> FAILED
                        </div>
                      ) : (
                        <div className={cn(styles.badge, styles.badgePending)}>
                          <Loader2 size={14} className={styles.spin} /> PENDING
                        </div>
                      )}
                    </div>
                    
                    <button
                      className={styles.iconBtn}
                      title="Delete Document"
                      onClick={(e) => requestDelete(doc.id, e)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!docToDelete}
        title="Delete document?"
        message={
          <>
            Are you sure you want to delete this document?<br />
            This will permanently erase all associated chats, summaries, and proposals.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
}
