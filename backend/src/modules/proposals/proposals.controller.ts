import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { GenerateProposalDto } from './dto/generate-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalsService } from './proposals.service';

@ApiTags('Proposals')
@ApiBearerAuth()
@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Post('generate')
  generate(
    @Body() dto: GenerateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposalsService.generate(dto.inquiryId, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get('by-inquiry/:inquiryId')
  findByInquiry(
    @Param('inquiryId') inquiryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposalsService.findByInquiry(inquiryId, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get(':id')
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
