export interface ProposalGenerationInput {
  companyName: string;
  projectTitle: string;
  description: string;
  projectType: string;
  budgetRange: string;
  expectedTimeline: string;
  priority: string;
  technicalNotes?: string | null;
}

export interface ProposalGenerationResult {
  projectSummary: string;
  suggestedFeatures: string;
  technicalApproach: string;
  estimatedComplexity: string;
  suggestedTimeline: string;
  questionsToAsk: string;
}

export interface ProposalGenerator {
  generate(input: ProposalGenerationInput): Promise<ProposalGenerationResult>;
}

export const PROPOSAL_GENERATOR = Symbol('PROPOSAL_GENERATOR');
