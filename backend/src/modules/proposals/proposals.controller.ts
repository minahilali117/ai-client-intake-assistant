import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { GenerateProposalDto } from './dto/generate-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalPdfService } from './proposal-pdf.service';
import { ProposalsService } from './proposals.service';

@ApiTags('Proposals')
@ApiBearerAuth('access-token')
@Controller('proposals')
export class ProposalsController {
  constructor(
    private proposalsService: ProposalsService,
    private proposalPdfService: ProposalPdfService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Generate proposal brief from inquiry (AI or mock)' })
  @Post('generate')
  generate(
    @Body() dto: GenerateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposalsService.generate(dto.inquiryId, user);
  }

  @Get('by-inquiry/:inquiryId')
  findByInquiry(
    @Param('inquiryId') inquiryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposalsService.findByInquiry(inquiryId, user);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export proposal as PDF' })
  @ApiProduces('application/pdf')
  async exportPdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    await this.proposalsService.findOne(id, user);
    const { stream, fileName } = await this.proposalPdfService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    stream.pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposalsService.findOne(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposalsService.update(id, dto, user);
  }
}
