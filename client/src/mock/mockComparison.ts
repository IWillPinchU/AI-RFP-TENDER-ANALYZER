import type { DocumentComparison } from '@/types/compare.types';

export const mockComparison: DocumentComparison = {
  id: 1,
  query: 'Eligibility, Financial, Technical',
  documentNameA: 'RFP_City_Infrastructure_2026.pdf',
  documentNameB: 'Tender_IT_Services_Q2.pdf',
  documentAId: 1,
  documentBId: 2,
  similarities: [
    'Both require ISO certification',
    'Both have EMD requirements',
    'Both require 3+ years of experience',
  ],
  differences: [
    { aspect: 'Budget', documentA: '₹200 crore', documentB: '₹15 crore' },
    { aspect: 'Domain', documentA: 'Infrastructure', documentB: 'IT Services' },
    { aspect: 'Duration', documentA: '24 months', documentB: '12 months' },
  ],
  documentAAdvantages: ['Larger scope for long-term engagement', 'Higher revenue potential'],
  documentBAdvantages: ['Lower risk', 'Faster turnaround', 'Lower capital requirement'],
  recommendation: 'Consider bidding on both. IT Services tender offers quick wins while Infrastructure provides long-term value.',
  riskExplanation: 'Infrastructure project carries timeline and resource risks. IT Services has lower overall risk.',
  documentARisk: 'Medium',
  documentBRisk: 'Low',
  createdAt: '2026-04-09T15:00:00Z',
};
