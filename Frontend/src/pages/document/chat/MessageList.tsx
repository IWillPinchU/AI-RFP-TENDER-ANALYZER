import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatMessage } from '@/types/chat.types';
import { MessageItem } from './MessageItem';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!messages || messages.length === 0) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MessageSquare size={24} />
          </div>
          <h4 className={styles.emptyTitle}>AI Document Chat</h4>
          <p className={styles.emptySubtitle}>
            Ask questions about this document's eligibility, financial thresholds, or critical deadlines.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer} ref={listRef}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} />
        </div>
      )}
    </div>
  );
}
