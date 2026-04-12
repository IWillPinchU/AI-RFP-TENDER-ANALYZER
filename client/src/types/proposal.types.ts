/* ── Proposal Types ── */

export interface ProposalSection {
  id: string;
  sectionTitle: string;
  points: string[];
  orderIndex: number;
}

export interface Proposal {
  id: string;
  title: string;
  documentName: string;
  documentId: string;
  sections: ProposalSection[] | null;
  createdAt: string;
}

export interface GenerateProposalRequest {
  documentId: string;
  title: string;
  sections: string[];
}

export const PROPOSAL_SECTIONS = [
  'Executive Summary',
  'Technical Approach',
  'Deliverables',
  'Risk Mitigation',
  'Pricing & Budget',
  'Team & Qualifications',
  'Timeline',
] as const;

export type ProposalSectionName = typeof PROPOSAL_SECTIONS[number];
