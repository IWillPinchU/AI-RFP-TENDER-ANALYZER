/* ── Compare Service ── */

import type { DocumentComparison, RunComparisonRequest } from '@/types/compare.types';
import { fetcher } from './api';

export const compareService = {
  async runComparison(req: RunComparisonRequest): Promise<DocumentComparison> {
    return fetcher<DocumentComparison>('/compare/run', {
      method: 'POST',
      body: JSON.stringify({
        documentIdA: req.documentAId,
        documentIdB: req.documentBId,
        query: req.aspects[0],
      }),
    });
  },

  async listComparisons(): Promise<DocumentComparison[]> {
    return fetcher<DocumentComparison[]>('/compare', { method: 'GET' });
  },

  async getComparison(id: number): Promise<DocumentComparison> {
    return fetcher<DocumentComparison>(`/compare/${id}`, { method: 'GET' });
  },

  async deleteComparison(id: number): Promise<void> {
    return fetcher<void>(`/compare/${id}`, { method: 'DELETE' });
  },
};
