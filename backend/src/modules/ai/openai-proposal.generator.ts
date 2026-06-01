import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ProposalGenerationInput,
  ProposalGenerationResult,
  ProposalGenerator,
} from './proposal-generator.interface';
import { MockProposalGenerator } from './mock-proposal.generator';

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

@Injectable()
export class OpenAIProposalGenerator implements ProposalGenerator {
  private readonly logger = new Logger(OpenAIProposalGenerator.name);
  private readonly fallback = new MockProposalGenerator();

  constructor(private configService: ConfigService) {}

  async generate(
    input: ProposalGenerationInput,
  ): Promise<ProposalGenerationResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    if (!apiKey) {
      return this.fallback.generate(input);
    }

    const systemPrompt = `You are a senior solutions consultant. Return ONLY valid JSON with keys: projectSummary, suggestedFeatures, technicalApproach, estimatedComplexity, suggestedTimeline, questionsToAsk. Use newline-separated bullet lists for suggestedFeatures and questionsToAsk.`;

    const userPrompt = JSON.stringify({
      client: input.companyName,
      projectTitle: input.projectTitle,
      description: input.description,
      projectType: input.projectType,
      budgetRange: input.budgetRange,
      expectedTimeline: input.expectedTimeline,
      priority: input.priority,
      technicalNotes: input.technicalNotes,
    });

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `OpenAI request failed (${response.status}), using mock generator`,
        );
        return this.fallback.generate(input);
      }

      const data = (await response.json()) as OpenAIChatResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return this.fallback.generate(input);
      }

      const parsed = JSON.parse(content) as Partial<ProposalGenerationResult>;
      const fallback = await this.fallback.generate(input);

      return {
        projectSummary: parsed.projectSummary ?? fallback.projectSummary,
        suggestedFeatures:
          parsed.suggestedFeatures ?? fallback.suggestedFeatures,
        technicalApproach:
          parsed.technicalApproach ?? fallback.technicalApproach,
        estimatedComplexity:
          parsed.estimatedComplexity ?? fallback.estimatedComplexity,
        suggestedTimeline:
          parsed.suggestedTimeline ?? fallback.suggestedTimeline,
        questionsToAsk: parsed.questionsToAsk ?? fallback.questionsToAsk,
      };
    } catch (error) {
      this.logger.warn(
        `OpenAI error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return this.fallback.generate(input);
    }
  }
}
