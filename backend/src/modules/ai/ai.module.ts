import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PROPOSAL_GENERATOR } from './proposal-generator.interface';
import { MockProposalGenerator } from './mock-proposal.generator';
import { OpenAIProposalGenerator } from './openai-proposal.generator';

@Module({
  providers: [
    MockProposalGenerator,
    OpenAIProposalGenerator,
    {
      provide: PROPOSAL_GENERATOR,
      useFactory: (
        configService: ConfigService,
        openaiGenerator: OpenAIProposalGenerator,
        mockGenerator: MockProposalGenerator,
      ) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return apiKey?.trim() ? openaiGenerator : mockGenerator;
      },
      inject: [ConfigService, OpenAIProposalGenerator, MockProposalGenerator],
    },
  ],
  exports: [PROPOSAL_GENERATOR],
})
export class AiModule {}
