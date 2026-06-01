import {
  ActivityAction,
  LeadStatus,
  PrismaClient,
  Priority,
  ProjectType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: UserRole.ADMIN,
  },
  {
    name: 'Sales User',
    email: 'sales@example.com',
    password: 'Sales123!',
    role: UserRole.SALES,
  },
  {
    name: 'Developer User',
    email: 'developer@example.com',
    password: 'Developer123!',
    role: UserRole.DEVELOPER,
  },
] as const;

async function main() {
  const users: Record<string, { id: string }> = {};

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        refreshTokenHash: null,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
    users[user.role] = record;
  }

  const salesId = users[UserRole.SALES].id;

  const leadNew = await prisma.lead.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      companyName: 'Northwind Logistics',
      contactPerson: 'Alex Rivera',
      email: 'alex@northwind.io',
      phone: '+1-555-1001',
      source: 'Referral',
      status: LeadStatus.NEW,
      createdById: salesId,
    },
  });

  const leadQualified = await prisma.lead.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      companyName: 'BrightPath Health',
      contactPerson: 'Morgan Lee',
      email: 'morgan@brightpath.health',
      source: 'Website',
      status: LeadStatus.QUALIFIED,
      createdById: salesId,
    },
  });

  const leadProposal = await prisma.lead.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      companyName: 'Summit Retail Group',
      contactPerson: 'Jordan Kim',
      email: 'jordan@summitretail.com',
      phone: '+1-555-2002',
      source: 'Conference',
      status: LeadStatus.PROPOSAL_SENT,
      createdById: salesId,
    },
  });

  const inquiry1 = await prisma.inquiry.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      leadId: leadQualified.id,
      projectTitle: 'Patient Portal MVP',
      description:
        'HIPAA-aware patient portal with scheduling, messaging, and document upload.',
      projectType: ProjectType.WEB_APP,
      budgetRange: '$80k–$120k',
      expectedTimeline: '4–6 months',
      priority: Priority.HIGH,
      technicalNotes: 'Prefer Next.js and NestJS. Need audit logging.',
    },
  });

  const inquiry2 = await prisma.inquiry.upsert({
    where: { id: '00000000-0000-4000-8000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000102',
      leadId: leadProposal.id,
      projectTitle: 'Inventory Forecasting AI',
      description:
        'Integrate ML-based demand forecasting into existing ERP workflows.',
      projectType: ProjectType.AI_INTEGRATION,
      budgetRange: '$150k–$250k',
      expectedTimeline: '6–9 months',
      priority: Priority.MEDIUM,
    },
  });

  const sampleProposal = await prisma.proposal.upsert({
    where: { inquiryId: inquiry2.id },
    update: {},
    create: {
      inquiryId: inquiry2.id,
      leadId: leadProposal.id,
      projectSummary:
        'Summit Retail Group wants ML-driven inventory forecasting integrated with their ERP to reduce stockouts and overstock.',
      suggestedFeatures:
        'Demand forecasting model training pipeline\nERP integration layer\nForecast review dashboard\nAlerting for anomaly detection',
      technicalApproach:
        'Batch + near-real-time inference service, feature store for historical sales, REST APIs into ERP, observability for model drift.',
      estimatedComplexity: 'High — data quality and ERP integration are primary risks',
      suggestedTimeline:
        'Discovery: 3 weeks\nMVP models: 8 weeks\nProduction hardening: 4 weeks',
      questionsToAsk:
        'Which ERP modules are in scope?\nWhat historical data volume is available?\nWho signs off on forecast accuracy?',
      generatedByAI: false,
    },
  });

  await prisma.activityLog.deleteMany({
    where: {
      entityId: {
        in: [leadNew.id, leadQualified.id, inquiry1.id, sampleProposal.id],
      },
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: salesId,
        action: ActivityAction.LEAD_CREATED,
        entityType: 'lead',
        entityId: leadNew.id,
        metadata: { newValue: { companyName: leadNew.companyName } },
      },
      {
        userId: salesId,
        action: ActivityAction.LEAD_CREATED,
        entityType: 'lead',
        entityId: leadQualified.id,
        metadata: { newValue: { companyName: leadQualified.companyName } },
      },
      {
        userId: salesId,
        action: ActivityAction.LEAD_STATUS_CHANGED,
        entityType: 'lead',
        entityId: leadQualified.id,
        metadata: {
          field: 'status',
          oldValue: LeadStatus.CONTACTED,
          newValue: LeadStatus.QUALIFIED,
        },
      },
      {
        userId: salesId,
        action: ActivityAction.INQUIRY_CREATED,
        entityType: 'inquiry',
        entityId: inquiry1.id,
        metadata: { newValue: { projectTitle: inquiry1.projectTitle } },
      },
      {
        userId: users[UserRole.DEVELOPER].id,
        action: ActivityAction.TECHNICAL_NOTE_ADDED,
        entityType: 'inquiry',
        entityId: inquiry1.id,
        metadata: {
          field: 'technicalNotes',
          oldValue: null,
          newValue: inquiry1.technicalNotes,
        },
      },
      {
        userId: salesId,
        action: ActivityAction.PROPOSAL_GENERATED,
        entityType: 'proposal',
        entityId: sampleProposal.id,
        metadata: {
          inquiryId: inquiry2.id,
          generatedByAI: false,
        },
      },
    ],
  });

  console.log(
    'Seed completed: users, leads, inquiries, proposals, and activity logs.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
