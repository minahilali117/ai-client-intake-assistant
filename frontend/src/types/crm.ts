export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'WON'
  | 'LOST';

export type ProjectType =
  | 'WEB_APP'
  | 'MOBILE_APP'
  | 'SAAS'
  | 'AI_INTEGRATION'
  | 'CLOUD'
  | 'MVP'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  source: string;
  status: LeadStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email: string; role: string };
  _count?: { inquiries: number };
  inquiries?: Inquiry[];
}

export interface Inquiry {
  id: string;
  leadId: string;
  projectTitle: string;
  description: string;
  projectType: ProjectType;
  budgetRange: string;
  expectedTimeline: string;
  priority: Priority;
  technicalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: Pick<Lead, 'id' | 'companyName' | 'status' | 'contactPerson' | 'email'>;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface Proposal {
  id: string;
  inquiryId: string;
  leadId: string;
  projectSummary: string;
  suggestedFeatures: string;
  technicalApproach: string;
  estimatedComplexity: string;
  suggestedTimeline: string;
  questionsToAsk: string;
  generatedByAI: boolean;
  createdAt: string;
  updatedAt: string;
  inquiry?: {
    id: string;
    projectTitle: string;
    projectType: ProjectType;
    leadId: string;
  };
  lead?: {
    id: string;
    companyName: string;
    status: LeadStatus;
  };
}

export interface DashboardSummary {
  cards: {
    totalLeads: number;
    qualifiedLeads: number;
    proposalsSent: number;
    wonCount: number;
    lostCount: number;
  };
  leadsByStatus: Array<{ status: LeadStatus; count: number }>;
  leadsByProjectType: Array<{ projectType: ProjectType; count: number }>;
  recentActivity: ActivityLog[];
}
