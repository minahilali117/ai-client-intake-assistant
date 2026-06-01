import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  LeadStatus,
  Prisma,
  Priority,
  UserRole,
} from '@prisma/client';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QueryInquiriesDto } from './dto/query-inquiries.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { UpdateTechnicalNotesDto } from './dto/update-technical-notes.dto';

const inquiryInclude = {
  lead: {
    select: {
      id: true,
      companyName: true,
      status: true,
      contactPerson: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class InquiriesService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateInquiryDto, user: AuthenticatedUser) {
    this.assertCanManageInquiries(user);
    const lead = await this.getLeadForInquiry(dto.leadId, user);

    const inquiry = await this.prisma.inquiry.create({
      data: {
        leadId: lead.id,
        projectTitle: dto.projectTitle,
        description: dto.description,
        projectType: dto.projectType,
        budgetRange: dto.budgetRange,
        expectedTimeline: dto.expectedTimeline,
        priority: dto.priority ?? Priority.MEDIUM,
        technicalNotes: dto.technicalNotes,
      },
      include: inquiryInclude,
    });

    await this.activityLogs.log(
      user.id,
      ActivityAction.INQUIRY_CREATED,
      'inquiry',
      inquiry.id,
      {
        leadId: lead.id,
        newValue: { projectTitle: inquiry.projectTitle },
      },
    );

    return inquiry;
  }

  async findAll(
    query: QueryInquiriesDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query, user);

    const allowedSortFields = ['createdAt', 'updatedAt', 'priority'] as const;
    const sortBy = allowedSortFields.includes(
      (query.sortBy ?? 'createdAt') as (typeof allowedSortFields)[number],
    )
      ? (query.sortBy as (typeof allowedSortFields)[number])
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        include: inquiryInclude,
        skip,
        take: limit,
        orderBy: { [sortBy]: query.sortOrder ?? 'desc' },
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id, deletedAt: null },
      include: inquiryInclude,
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    this.assertCanViewInquiry(inquiry.lead.status, user);
    return inquiry;
  }

  async update(id: string, dto: UpdateInquiryDto, user: AuthenticatedUser) {
    const inquiry = await this.getActiveInquiry(id);
    this.assertCanManageInquiries(user);
    await this.getLeadForInquiry(inquiry.leadId, user);

    return this.prisma.inquiry.update({
      where: { id },
      data: dto,
      include: inquiryInclude,
    });
  }

  async updateTechnicalNotes(
    id: string,
    dto: UpdateTechnicalNotesDto,
    user: AuthenticatedUser,
  ) {
    const inquiry = await this.getActiveInquiry(id);
    this.assertCanViewInquiry(inquiry.lead.status, user);

    if (user.role === UserRole.DEVELOPER) {
      const updated = await this.prisma.inquiry.update({
        where: { id },
        data: { technicalNotes: dto.technicalNotes },
        include: inquiryInclude,
      });

      await this.activityLogs.log(
        user.id,
        ActivityAction.TECHNICAL_NOTE_ADDED,
        'inquiry',
        id,
        {
          field: 'technicalNotes',
          oldValue: inquiry.technicalNotes,
          newValue: dto.technicalNotes,
        },
      );

      return updated;
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SALES) {
      return this.update(id, { technicalNotes: dto.technicalNotes }, user);
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.assertCanManageInquiries(user);
    await this.getActiveInquiry(id);

    return this.prisma.inquiry.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: inquiryInclude,
    });
  }

  private buildWhere(
    query: QueryInquiriesDto,
    user: AuthenticatedUser,
  ): Prisma.InquiryWhereInput {
    const where: Prisma.InquiryWhereInput = { deletedAt: null };

    if (user.role === UserRole.DEVELOPER) {
      where.lead = { status: LeadStatus.QUALIFIED, deletedAt: null };
    }

    if (query.leadId) {
      where.leadId = query.leadId;
    }

    if (query.projectType) {
      where.projectType = query.projectType;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search) {
      where.OR = [
        { projectTitle: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async getActiveInquiry(id: string) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id, deletedAt: null },
      include: { lead: true },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    return inquiry;
  }

  private async getLeadForInquiry(leadId: string, user: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, deletedAt: null },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    this.assertCanViewInquiry(lead.status, user);
    if (user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Developers cannot create or edit inquiries');
    }
    return lead;
  }

  private assertCanManageInquiries(user: AuthenticatedUser) {
    if (user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Developers cannot manage inquiries');
    }
  }

  private assertCanViewInquiry(status: LeadStatus, user: AuthenticatedUser) {
    if (
      user.role === UserRole.DEVELOPER &&
      status !== LeadStatus.QUALIFIED
    ) {
      throw new ForbiddenException(
        'Developers can only access inquiries for qualified leads',
      );
    }
  }
}
