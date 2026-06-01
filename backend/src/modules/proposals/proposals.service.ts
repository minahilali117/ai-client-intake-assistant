import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityAction, LeadStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  PROPOSAL_GENERATOR,
  ProposalGenerationInput,
  ProposalGenerator,
} from '../ai/proposal-generator.interface';
import { UpdateProposalDto } from './dto/update-proposal.dto';

const proposalInclude = {
  inquiry: {
    select: {
      id: true,
      projectTitle: true,
      projectType: true,
      leadId: true,
    },
  },
  lead: {
    select: {
      id: true,
      companyName: true,
      status: true,
    },
  },
} as const;

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
    @Inject(PROPOSAL_GENERATOR)
    private proposalGenerator: ProposalGenerator,
    private configService: ConfigService,
  ) {}

  async generate(inquiryId: string, user: AuthenticatedUser) {
    this.assertCanManageProposals(user);

    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, deletedAt: null },
      include: {
        lead: true,
        proposal: true,
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const input: ProposalGenerationInput = {
      companyName: inquiry.lead.companyName,
      projectTitle: inquiry.projectTitle,
      description: inquiry.description,
      projectType: inquiry.projectType,
      budgetRange: inquiry.budgetRange,
      expectedTimeline: inquiry.expectedTimeline,
      priority: inquiry.priority,
      technicalNotes: inquiry.technicalNotes,
    };

    const generated = await this.proposalGenerator.generate(input);
    const usedOpenAI = Boolean(
      this.configService.get<string>('OPENAI_API_KEY')?.trim(),
    );

    const proposal = inquiry.proposal
      ? await this.prisma.proposal.update({
          where: { id: inquiry.proposal.id },
          data: {
            ...generated,
            generatedByAI: usedOpenAI,
            deletedAt: null,
          },
          include: proposalInclude,
        })
      : await this.prisma.proposal.create({
          data: {
            inquiryId: inquiry.id,
            leadId: inquiry.leadId,
            ...generated,
            generatedByAI: usedOpenAI,
          },
          include: proposalInclude,
        });

    await this.prisma.lead.update({
      where: { id: inquiry.leadId },
      data: { status: LeadStatus.PROPOSAL_SENT },
    });

    await this.activityLogs.log(
      user.id,
      ActivityAction.PROPOSAL_GENERATED,
      'proposal',
      proposal.id,
      {
        inquiryId,
        generatedByAI: usedOpenAI,
        newValue: { projectTitle: inquiry.projectTitle },
      },
    );

    return proposal;
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const proposal = await this.getActiveProposal(id);
    this.assertCanViewProposal(proposal.lead.status, user);
    return proposal;
  }

  async findByInquiry(inquiryId: string, user: AuthenticatedUser) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { inquiryId, deletedAt: null },
      include: proposalInclude,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found for this inquiry');
    }

    this.assertCanViewProposal(proposal.lead.status, user);
    return proposal;
  }

  async update(id: string, dto: UpdateProposalDto, user: AuthenticatedUser) {
    this.assertCanManageProposals(user);
    const existing = await this.getActiveProposal(id);

    const proposal = await this.prisma.proposal.update({
      where: { id },
      data: {
        ...dto,
        generatedByAI: false,
      },
      include: proposalInclude,
    });

    await this.activityLogs.log(
      user.id,
      ActivityAction.PROPOSAL_EDITED,
      'proposal',
      id,
      {
        oldValue: {
          projectSummary: existing.projectSummary,
        },
        newValue: dto,
      },
    );

    return proposal;
  }

  private async getActiveProposal(id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, deletedAt: null },
      include: proposalInclude,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  private assertCanManageProposals(user: AuthenticatedUser) {
    if (user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Developers cannot manage proposals');
    }
  }

  private assertCanViewProposal(status: LeadStatus, user: AuthenticatedUser) {
    if (
      user.role === UserRole.DEVELOPER &&
      status !== LeadStatus.QUALIFIED &&
      status !== LeadStatus.PROPOSAL_SENT &&
      status !== LeadStatus.WON
    ) {
      throw new ForbiddenException(
        'Developers can only view proposals for qualified or later-stage leads',
      );
    }
  }
}
