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
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QueryInquiriesDto } from './dto/query-inquiries.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { UpdateTechnicalNotesDto } from './dto/update-technical-notes.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller('inquiries')
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Post()
  create(
    @Body() dto: CreateInquiryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.create(dto, user);
  }

  @Get()
  findAll(
    @Query() query: QueryInquiriesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.findAll(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.findOne(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.update(id, dto, user);
  }

  @Patch(':id/technical-notes')
  updateTechnicalNotes(
    @Param('id') id: string,
    @Body() dto: UpdateTechnicalNotesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.updateTechnicalNotes(id, dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.remove(id, user);
  }
}
