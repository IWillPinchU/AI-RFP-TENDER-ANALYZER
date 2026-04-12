/* ── QA Service ── */

import type { DocumentQAResponse, QAAnswerResponse } from '@/types/qa.types';
import { fetcher } from './api';

export const qaService = {
  /** Get or auto-generate questions for a document (cached after first call). */
  async getQuestions(documentId: string): Promise<DocumentQAResponse> {
    return fetcher<DocumentQAResponse>(`/qa/${documentId}`, { method: 'GET' });
  },

  /** Force regeneration of questions, overwriting the cache. */
  async regenerateQuestions(documentId: string): Promise<DocumentQAResponse> {
    return fetcher<DocumentQAResponse>(`/qa/${documentId}/regenerate`, { method: 'POST' });
  },

  /** Get AI answer for a specific question against the document. */
  async getAnswer(documentId: string, question: string): Promise<QAAnswerResponse> {
    return fetcher<QAAnswerResponse>(`/qa/${documentId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },
};
