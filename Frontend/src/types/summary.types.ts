

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface CategoryDetails {
  section_overview: string;
  detailed_analysis: string;
  key_points: string[];
  risks_and_considerations: string;
  action_items: string[];
}

export type SummaryCategories = {
  [categoryName: string]: CategoryDetails;
};

export interface DocumentSummaryResponse {
  overview: string;
  estimatedRisk: RiskLevel;
  winProbability: number;
  tenderPurpose: string;
  scopeOfWork: string[];
  criticalDeadlines: string[];
  eligibilityHighlights: string[];
  overallRecommendation: string;
  cached: boolean;
  createdAt: string;
  categories: SummaryCategories;
}

export interface GenerateSummaryRequest {
  documentId: string;
}
