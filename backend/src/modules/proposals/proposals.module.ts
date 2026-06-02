import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ProposalsController } from './proposals.controller';
import { ProposalPdfService } from './proposal-pdf.service';
import { ProposalsService } from './proposals.service';

@Module({
  imports: [AiModule],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalPdfService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
