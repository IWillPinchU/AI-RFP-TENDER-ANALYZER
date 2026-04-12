import type { DocumentSummaryResponse } from '@/types/summary.types';
import { fetcher } from './api';

export const summaryService = {
  // GET /api/summary/{documentId}
  async getSummary(documentId: string): Promise<DocumentSummaryResponse | null> {
    return fetcher<DocumentSummaryResponse | null>(`/summary/${documentId}`, { method: 'GET' });
  },

  // POST /api/summary/generate
  async generateSummary(documentId: string): Promise<DocumentSummaryResponse> {
    return fetcher<DocumentSummaryResponse>('/summary/generate', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  },

  // DELETE /api/summary/{documentId}
  async deleteSummary(documentId: string): Promise<{ success: boolean; message: string }> {
    return fetcher(`/summary/${documentId}`, { method: 'DELETE' });
  },
};
