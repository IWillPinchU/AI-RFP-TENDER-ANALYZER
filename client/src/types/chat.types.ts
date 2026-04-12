/* ── Chat Types ── */

export type MessageRole = 'USER' | 'AI';

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  mainAnswer: string[] | null;
  conclusion: string | null;
  riskAnalysis?: string | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  documentName: string;
  documentId: string;
  messages: ChatMessage[];
  createdAt: string;
}
