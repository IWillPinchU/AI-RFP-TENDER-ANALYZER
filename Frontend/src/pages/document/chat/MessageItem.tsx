import { Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/types/chat.types';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'USER';

  return (
    <div className={`${styles.itemContainer} ${isUser ? styles.itemUser : styles.itemAi}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>

        {!isUser && (
          <div className={styles.header}>
            <Sparkles size={10} />
            AI Assistant
          </div>
        )}

        {isUser ? (
          <div className={styles.userContent}>{message.content}</div>
        ) : (
          <div className={styles.aiContent}>
            {message.mainAnswer && message.mainAnswer.length > 0 && (
              <ul className={styles.mainAnswer}>
                {message.mainAnswer.map((point, idx) => (
                  <li key={idx} className={styles.answerItem}>
                    <span className={styles.bullet}>▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {message.conclusion && (
              <div className={styles.conclusion}>
                {message.conclusion}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.metadata}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
