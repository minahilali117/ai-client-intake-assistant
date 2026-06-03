import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, LeadStatus, UserRole } from '@prisma/client';
import { buildLeadWhereForUser } from '../../common/helpers/lead-where.helper';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async getSummary(user: AuthenticatedUser) {
    const leadWhere = buildLeadWhereForUser(user);

    const activityWhere: Prisma.ActivityLogWhereInput =
      user.role === UserRole.DEVELOPER ? { entityType: { not: 'lead' } } : {};

    const [
      totalLeads,
      qualifiedLeads,
      proposalsSent,
      wonCount,
      lostCount,
      leadsByStatus,
      inquiriesByType,
      recentActivity,
    ] = await Promise.all([
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.count({
        where: { ...leadWhere, status: LeadStatus.QUALIFIED },
      }),
      this.prisma.lead.count({
        where: { ...leadWhere, status: LeadStatus.PROPOSAL_SENT },
      }),
      this.prisma.lead.count({
        where: { ...leadWhere, status: LeadStatus.WON },
      }),
      this.prisma.lead.count({
        where: { ...leadWhere, status: LeadStatus.LOST },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: leadWhere,
        _count: { status: true },
      }),
      this.prisma.inquiry.groupBy({
        by: ['projectType'],
        where: {
          deletedAt: null,
          lead: leadWhere,
        },
        _count: { projectType: true },
      }),
      this.activityLogs.findRecent(15, activityWhere),
    ]);

    return {
      cards: {
        totalLeads,
        qualifiedLeads,
        proposalsSent,
        wonCount,
        lostCount,
      },
      leadsByStatus: leadsByStatus.map((row) => ({
        status: row.status,
        count: row._count.status,
      })),
      leadsByProjectType: inquiriesByType.map((row) => ({
        projectType: row.projectType,
        count: row._count.projectType,
      })),
      recentActivity,
    };
  }
}
