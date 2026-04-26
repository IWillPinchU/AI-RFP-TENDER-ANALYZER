

export interface DocumentQAResponse {
  documentId: string;
  documentName: string;
  questions: string[];
  cached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QAAnswerResponse {
  question: string;
  mainAnswer: string[];
  conclusion: string;
}
