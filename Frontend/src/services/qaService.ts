

import type { DocumentQAResponse, QAAnswerResponse } from '@/types/qa.types';
import { fetcher } from './api';

export const qaService = {
  
  async getQuestions(documentId: string): Promise<DocumentQAResponse> {
    return fetcher<DocumentQAResponse>(`/qa/${documentId}`, { method: 'GET' });
  },

  
  async regenerateQuestions(documentId: string): Promise<DocumentQAResponse> {
    return fetcher<DocumentQAResponse>(`/qa/${documentId}/regenerate`, { method: 'POST' });
  },

  
  async getAnswer(documentId: string, question: string): Promise<QAAnswerResponse> {
    return fetcher<QAAnswerResponse>(`/qa/${documentId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },
};
