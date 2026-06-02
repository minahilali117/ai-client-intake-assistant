import { MockProposalGenerator } from './mock-proposal.generator';

describe('MockProposalGenerator', () => {
  const generator = new MockProposalGenerator();

  it('returns all required proposal fields', async () => {
    const result = await generator.generate({
      companyName: 'Acme',
      projectTitle: 'Portal',
      description: 'Build a portal',
      projectType: 'WEB_APP',
      budgetRange: '$50k',
      expectedTimeline: '3 months',
      priority: 'HIGH',
    });

    expect(result.projectSummary).toContain('Acme');
    expect(result.suggestedFeatures.length).toBeGreaterThan(10);
    expect(result.technicalApproach).toContain('Next.js');
    expect(result.estimatedComplexity).toBeTruthy();
    expect(result.suggestedTimeline).toBeTruthy();
    expect(result.questionsToAsk).toContain('?');
  });
});
