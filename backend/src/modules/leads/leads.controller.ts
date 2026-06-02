import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Post()
  create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.create(dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get()
  findAll(
    @Query() query: QueryLeadsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.findAll(query, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.findOne(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.update(id, dto, user);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.remove(id, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/restore')
  restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.restore(id, user);
  }
}
