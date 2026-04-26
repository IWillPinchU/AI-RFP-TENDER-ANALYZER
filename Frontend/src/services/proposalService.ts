

import type { Proposal, GenerateProposalRequest } from '@/types/proposal.types';
import { fetcher } from './api';

export const proposalService = {
  
  async generateProposal(req: GenerateProposalRequest): Promise<Proposal> {
    return fetcher<Proposal>('/proposals/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  
  async listProposals(documentId: string): Promise<Proposal[]> {
    return fetcher<Proposal[]>(`/proposals?documentId=${documentId}`, { method: 'GET' });
  },

  
  async getProposal(proposalId: string): Promise<Proposal> {
    return fetcher<Proposal>(`/proposals/${proposalId}`, { method: 'GET' });
  },

  
  async deleteProposal(proposalId: string): Promise<void> {
    return fetcher(`/proposals/${proposalId}`, { method: 'DELETE' });
  },
};
