import { useOutletContext } from 'react-router';
import type { Document } from '@/types/document.types';
import { ChatInterface } from './ChatInterface';

interface DocumentOutletContext {
  document: Document;
}

export function ChatPage() {
  const { document } = useOutletContext<DocumentOutletContext>();

  if (!document.chatSessionId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: 'var(--text-secondary)',
        fontSize: 'var(--text-body)',
      }}>
        Chat session is not available yet. The document may still be processing.
      </div>
    );
  }

  return <ChatInterface sessionId={document.chatSessionId} />;
}
