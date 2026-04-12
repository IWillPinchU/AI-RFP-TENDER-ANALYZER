import type { Proposal } from '@/types/proposal.types';

export const mockProposals: Proposal[] = [
  {
    id: 1,
    title: 'Infrastructure Proposal v1',
    documentName: 'RFP_City_Infrastructure_2026.pdf',
    documentId: 1,
    sections: [
      {
        id: 1,
        sectionTitle: 'Executive Summary',
        points: [
          'We propose a comprehensive approach to urban infrastructure modernization.',
          'Our team brings 15+ years of experience in municipal projects.',
          'Estimated project completion: 18 months ahead of schedule.',
        ],
      },
      {
        id: 2,
        sectionTitle: 'Technical Approach',
        points: [
          'Phase 1: Site survey and geotechnical analysis (2 months).',
          'Phase 2: Road construction using polymer-modified bitumen.',
          'Phase 3: Drainage installation with precast concrete channels.',
        ],
      },
    ],
    createdAt: '2026-04-09T10:00:00Z',
  },
];
