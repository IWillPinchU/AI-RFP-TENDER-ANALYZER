

export type AiStatus = 'PENDING' | 'INDEXED' | 'FAILED';

export interface Document {
  id: string;
  originalFilename: string;
  storedFilename: string;
  fileType: string;
  aiStatus: AiStatus;
  chunksIndexed: number;
  chatSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadResponse {
  id: string;
  originalFilename: string;
  aiStatus: AiStatus;
}
