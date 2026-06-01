import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { ActivityLogsService } from './activity-logs.service';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityLogsController {
  constructor(private activityLogsService: ActivityLogsService) {}

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get()
  findRecent(@Query('limit') limit?: string) {
    const parsed = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    return this.activityLogsService.findRecent(parsed);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get(':entityType/:entityId')
  findForEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Math.min(parseInt(limit, 10), 50) : 20;
    return this.activityLogsService.findForEntity(
      entityType,
      entityId,
      parsed,
    );
  }
}
