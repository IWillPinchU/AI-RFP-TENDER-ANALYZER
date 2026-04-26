

export interface ComparisonDifference {
  aspect: string;
  documentA: string;
  documentB: string;
}

export interface DocumentComparison {
  id: number;
  query: string;
  documentNameA: string;
  documentNameB: string;
  documentAId: string;
  documentBId: string;
  similarities: string[];
  differences: ComparisonDifference[];
  documentAAdvantages: string[];
  documentBAdvantages: string[];
  recommendation: string;
  riskExplanation: string;
  documentARisk: 'Low' | 'Medium' | 'High';
  documentBRisk: 'Low' | 'Medium' | 'High';
  createdAt: string;
}

export interface RunComparisonRequest {
  documentAId: string;
  documentBId: string;
  aspects: string[];
}

export const COMPARISON_ASPECTS = [
  'Eligibility',
  'Financial',
  'Technical',
  'Legal',
  'Risk',
  'Pricing',
  'Deliverables',
  'Timeline',
] as const;

export type ComparisonAspect = typeof COMPARISON_ASPECTS[number];
