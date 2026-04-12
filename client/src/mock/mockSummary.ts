import type { DocumentSummary } from '@/types/summary.types';

export const mockSummary: DocumentSummary = {
  id: 1,
  documentId: 1,
  overview: 'This RFP covers urban infrastructure development for the City of Sacramento including road construction, drainage, and public utilities.',
  categories: [
    {
      categoryName: 'Financial',
      keyPoints: ['Estimated budget: ₹200 crore', 'EMD: ₹2 crore', 'Payment in milestone-based tranches'],
      details: 'Detailed financial requirements including bank guarantees and performance security.',
    },
    {
      categoryName: 'Eligibility',
      keyPoints: ['5 years experience required', 'ISO 9001 mandatory', 'Minimum ₹50 crore turnover'],
      details: 'Stringent eligibility criteria targeting experienced infrastructure firms.',
    },
    {
      categoryName: 'Technical',
      keyPoints: ['Road construction: 45km', 'Drainage: 30km', 'Utilities: water and sewage'],
      details: 'Comprehensive technical scope covering multiple infrastructure domains.',
    },
  ],
  estimatedRisk: 'Medium',
  winProbability: 68,
  tenderPurpose: 'Urban infrastructure development and modernization',
  scopeOfWork: 'Road construction, drainage systems, and public utility installation across 12 wards',
  criticalDeadlines: ['Bid submission: May 15, 2026', 'Pre-bid meeting: April 25, 2026', 'Project completion: December 2027'],
  eligibilityHighlights: ['5+ years operation', '₹50 crore turnover', 'ISO certified'],
  overallRecommendation: 'Proceed with bid preparation. The project aligns well with capabilities, though risk mitigation for timeline is recommended.',
  createdAt: '2026-04-08T12:00:00Z',
};
