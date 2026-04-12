/* ── Chat Service ── */

import type { ChatSession, ChatMessage } from '@/types/chat.types';
import { fetcher } from './api';

export const chatService = {
  // GET /api/chat/{sessionId}
  async getSession(sessionId: string): Promise<ChatSession> {
    return fetcher<ChatSession>(`/chat/${sessionId}`, { method: 'GET' });
  },

  // POST /api/chat/{sessionId}/send — body: {query}
  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    return fetcher<ChatMessage>(`/chat/${sessionId}/send`, {
      method: 'POST',
      body: JSON.stringify({ query: message }),
    });
  },
};
