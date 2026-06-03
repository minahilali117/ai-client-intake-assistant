import { Injectable } from '@nestjs/common';
import { ActivityAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ActivityMetadata {
  oldValue?: unknown;
  newValue?: unknown;
  field?: string;
  [key: string]: unknown;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: ActivityAction,
    entityType: 'lead' | 'inquiry' | 'proposal' | 'attachment',
    entityId: string,
    metadata: ActivityMetadata = {},
  ) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async findForEntity(entityType: string, entityId: string, limit = 20) {
    return this.prisma.activityLog.findMany({
      where: { entityType, entityId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // After
  async findRecent(limit = 10, where: Prisma.ActivityLogWhereInput = {}) {
    return this.prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
