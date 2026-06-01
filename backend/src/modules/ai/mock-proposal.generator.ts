import { Injectable } from '@nestjs/common';
import {
  ProposalGenerationInput,
  ProposalGenerationResult,
  ProposalGenerator,
} from './proposal-generator.interface';

@Injectable()
export class MockProposalGenerator implements ProposalGenerator {
  async generate(
    input: ProposalGenerationInput,
  ): Promise<ProposalGenerationResult> {
    const typeLabel = input.projectType.replace(/_/g, ' ').toLowerCase();

    return {
      projectSummary: `${input.companyName} is seeking a ${typeLabel} initiative titled "${input.projectTitle}". ${input.description} The engagement is scoped at ${input.budgetRange} with a target timeline of ${input.expectedTimeline}, prioritized as ${input.priority}.`,
      suggestedFeatures: [
        'Discovery workshop and requirements validation',
        'Role-based authentication and secure session management',
        'Core workflow screens aligned to sales/operations teams',
        'Admin dashboard with filters, search, and activity history',
        'REST API with validation, RBAC, and audit logging',
        'Deployment pipeline and environment configuration',
      ].join('\n'),
      technicalApproach: `We recommend a modular ${typeLabel} architecture using Next.js for the frontend, NestJS for APIs, PostgreSQL with Prisma, and containerized deployment. ${input.technicalNotes ? `Technical notes: ${input.technicalNotes}` : 'Integrations will be defined during discovery.'}`,
      estimatedComplexity: this.estimateComplexity(input),
      suggestedTimeline: this.suggestTimeline(input),
      questionsToAsk: [
        'Who are the primary user personas and daily workflows?',
        'What systems must we integrate with (CRM, billing, identity)?',
        'Are there compliance or data residency requirements?',
        'What does success look like 90 days after launch?',
        'How will content and user roles be managed post-launch?',
      ].join('\n'),
    };
  }

  private estimateComplexity(input: ProposalGenerationInput): string {
    const highTypes = ['AI_INTEGRATION', 'SAAS', 'MOBILE_APP'];
    if (highTypes.includes(input.projectType)) {
      return 'High — multiple integrations and iterative delivery recommended';
    }
    if (input.priority === 'URGENT' || input.priority === 'HIGH') {
      return 'Medium–High — accelerated timeline increases coordination overhead';
    }
    return 'Medium — suitable for phased MVP delivery';
  }

  private suggestTimeline(input: ProposalGenerationInput): string {
    return `Phase 1 (Discovery & design): 2–3 weeks\nPhase 2 (MVP build): aligned to ${input.expectedTimeline}\nPhase 3 (Hardening & launch): 2–4 weeks`;
  }
}
