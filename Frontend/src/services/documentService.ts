/* ── Document Service ── */

import type { Document, DocumentUploadResponse } from '@/types/document.types';
import { fetcher, uploadFetcher } from './api';

export const documentService = {
  // GET /api/documents
  async listDocuments(): Promise<Document[]> {
    return fetcher<Document[]>('/documents', { method: 'GET' });
  },

  // POST /api/documents/upload
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return uploadFetcher<DocumentUploadResponse>('/documents/upload', formData);
  },

  // DELETE /api/documents/:id
  async deleteDocument(id: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

