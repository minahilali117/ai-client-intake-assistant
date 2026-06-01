import type { LeadStatus, Priority, ProjectType } from '@/types/crm';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL_SENT: 'Proposal sent',
  WON: 'Won',
  LOST: 'Lost',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WEB_APP: 'Web app',
  MOBILE_APP: 'Mobile app',
  SAAS: 'SaaS',
  AI_INTEGRATION: 'AI integration',
  CLOUD: 'Cloud',
  MVP: 'MVP',
  OTHER: 'Other',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];
