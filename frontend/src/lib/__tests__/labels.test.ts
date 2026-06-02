import { LEAD_STATUS_LABELS, PROJECT_TYPE_LABELS } from '../labels';

describe('labels', () => {
  it('maps lead statuses to readable labels', () => {
    expect(LEAD_STATUS_LABELS.NEW).toBe('New');
    expect(LEAD_STATUS_LABELS.PROPOSAL_SENT).toBe('Proposal sent');
  });

  it('maps project types to readable labels', () => {
    expect(PROJECT_TYPE_LABELS.WEB_APP).toBe('Web app');
    expect(PROJECT_TYPE_LABELS.AI_INTEGRATION).toBe('AI integration');
  });
});
