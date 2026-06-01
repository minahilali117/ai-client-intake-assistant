import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, LeadStatus, Prisma, UserRole } from '@prisma/client';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

const leadInclude = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  _count: { select: { inquiries: true } },
} as const;

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateLeadDto, user: AuthenticatedUser) {
    this.assertCanManageLeads(user);

    const lead = await this.prisma.lead.create({
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        source: dto.source,
        status: dto.status ?? LeadStatus.NEW,
        createdById: user.id,
      },
      include: leadInclude,
    });

    await this.activityLogs.log(
      user.id,
      ActivityAction.LEAD_CREATED,
      'lead',
      lead.id,
      { newValue: { status: lead.status, companyName: lead.companyName } },
    );

    return lead;
  }

  async findAll(
    query: QueryLeadsDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(query, user);

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'companyName',
      'status',
    ] as const;
    const sortBy = allowedSortFields.includes(
      (query.sortBy ?? 'createdAt') as (typeof allowedSortFields)[number],
    )
      ? (query.sortBy as (typeof allowedSortFields)[number])
      : 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: leadInclude,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...leadInclude,
        inquiries: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    this.assertCanViewLead(lead.status, user);
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, user: AuthenticatedUser) {
    const existing = await this.getActiveLead(id);
    this.assertCanManageLeads(user);

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        source: dto.source,
        status: dto.status,
      },
      include: leadInclude,
    });

    const changes: Record<string, { oldValue: unknown; newValue: unknown }> =
      {};
    for (const key of Object.keys(dto) as (keyof UpdateLeadDto)[]) {
      const newVal = dto[key];
      if (newVal === undefined) continue;
      const oldVal = existing[key as keyof typeof existing];
      if (oldVal !== newVal) {
        changes[key] = { oldValue: oldVal, newValue: newVal };
      }
    }

    if (dto.status && dto.status !== existing.status) {
      await this.activityLogs.log(
        user.id,
        ActivityAction.LEAD_STATUS_CHANGED,
        'lead',
        id,
        {
          field: 'status',
          oldValue: existing.status,
          newValue: dto.status,
        },
      );
    }

    if (Object.keys(changes).length > 0) {
      await this.activityLogs.log(
        user.id,
        ActivityAction.LEAD_UPDATED,
        'lead',
        id,
        { changes },
      );
    }

    return lead;
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.assertCanManageLeads(user);
    await this.getActiveLead(id);

    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: leadInclude,
    });
  }

  private buildWhere(
    query: QueryLeadsDto,
    user: AuthenticatedUser,
  ): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = { deletedAt: null };

    if (user.role === UserRole.DEVELOPER) {
      where.status = LeadStatus.QUALIFIED;
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.source) {
      where.source = { equals: query.source, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async getActiveLead(id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  private assertCanManageLeads(user: AuthenticatedUser) {
    if (user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Developers cannot manage leads');
    }
  }

  private assertCanViewLead(status: LeadStatus, user: AuthenticatedUser) {
    if (
      user.role === UserRole.DEVELOPER &&
      status !== LeadStatus.QUALIFIED
    ) {
      throw new ForbiddenException(
        'Developers can only view qualified leads',
      );
    }
  }
}
