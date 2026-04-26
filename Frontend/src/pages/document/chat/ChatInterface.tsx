import { useState, useEffect } from 'react';
import type { ChatMessage } from '@/types/chat.types';
import { chatService } from '@/services/chatService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        setIsLoading(true);
        setError(null);
        const session = await chatService.getSession(sessionId);
        setMessages(session.messages ?? []);
      } catch (err) {
        setError('Failed to load chat history. Please try again.');
        console.error('[ChatInterface] loadSession error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  const handleSendMessage = async (text: string) => {
    
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'USER',
      content: text,
      mainAnswer: [],
      conclusion: '',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsSending(true);
    setError(null);

    try {
      const responseMsg = await chatService.sendMessage(sessionId, text);
      setMessages(prev => [...prev, responseMsg]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      console.error('[ChatInterface] sendMessage error:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          Loading chat session...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.errorState}>{error}</div>}
      <MessageList messages={messages} isLoading={isSending} />
      <ChatInput onSend={handleSendMessage} isLoading={isSending} />
    </div>
  );
}
