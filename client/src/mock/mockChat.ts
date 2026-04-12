import type { ChatSession } from '@/types/chat.types';

export const mockChatSession: ChatSession = {
  id: 1,
  title: 'RFP City Infrastructure Chat',
  documentName: 'RFP_City_Infrastructure_2026.pdf',
  documentId: 1,
  messages: [
    {
      id: 1,
      role: 'USER',
      content: 'What are the eligibility criteria?',
      mainAnswer: [],
      conclusion: '',
      createdAt: '2026-04-08T11:00:00Z',
    },
    {
      id: 2,
      role: 'AI',
      content: '',
      mainAnswer: [
        'The bidder must have a minimum 5-year track record in infrastructure projects.',
        'Annual turnover must exceed ₹50 crore for the last 3 financial years.',
        'Must hold valid ISO 9001 and ISO 14001 certifications.',
      ],
      conclusion: 'The document sets high eligibility thresholds targeting established infrastructure firms.',
      createdAt: '2026-04-08T11:00:05Z',
    },
  ],
  createdAt: '2026-04-08T11:00:00Z',
};
