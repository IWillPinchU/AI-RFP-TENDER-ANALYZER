/* ── Proposal Service ── */

import type { Proposal, GenerateProposalRequest } from '@/types/proposal.types';
import { fetcher } from './api';

export const proposalService = {
  /** Generate a new proposal for a document. */
  async generateProposal(req: GenerateProposalRequest): Promise<Proposal> {
    return fetcher<Proposal>('/proposals/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** List all proposals for a document (summary only, no sections). */
  async listProposals(documentId: string): Promise<Proposal[]> {
    return fetcher<Proposal[]>(`/proposals?documentId=${documentId}`, { method: 'GET' });
  },

  /** Get a single proposal with full section details. */
  async getProposal(proposalId: string): Promise<Proposal> {
    return fetcher<Proposal>(`/proposals/${proposalId}`, { method: 'GET' });
  },

  /** Delete a proposal. */
  async deleteProposal(proposalId: string): Promise<void> {
    return fetcher(`/proposals/${proposalId}`, { method: 'DELETE' });
  },
};
