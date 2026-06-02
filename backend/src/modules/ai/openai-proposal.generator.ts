import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ProposalGenerationInput,
  ProposalGenerationResult,
  ProposalGenerator,
} from './proposal-generator.interface';
import { MockProposalGenerator } from './mock-proposal.generator';
import { normalizeAiText } from './normalize-ai-text';

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
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY')?.trim();
    const provider = openAiApiKey ? 'openai' : groqApiKey ? 'groq' : null;
    const apiKey = provider === 'openai' ? openAiApiKey : groqApiKey;
    const model =
      provider === 'openai'
        ? (this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini')
        : (this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.1-8b-instant');
    const endpoint =
      provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://api.groq.com/openai/v1/chat/completions';

    if (!apiKey || !provider) {
      return this.fallback.generate(input);
    }

    const systemPrompt = `You are a senior solutions consultant. Return ONLY valid JSON with keys: projectSummary, suggestedFeatures, technicalApproach, estimatedComplexity, suggestedTimeline, questionsToAsk. Every value MUST be a plain string (never an object or array). For suggestedFeatures and questionsToAsk, use one string with newline-separated bullet points (e.g. "- Feature one\\n- Feature two"). projectSummary must be 2-4 sentences of prose.`;

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
        endpoint,
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
          `${provider} request failed (${response.status}), using mock generator`,
        );
        return this.fallback.generate(input);
      }

      const data = (await response.json()) as OpenAIChatResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return this.fallback.generate(input);
      }

      const parsed = JSON.parse(content) as Record<string, unknown>;
      const fallback = await this.fallback.generate(input);

      return {
        projectSummary:
          normalizeAiText(parsed.projectSummary) ?? fallback.projectSummary,
        suggestedFeatures:
          normalizeAiText(parsed.suggestedFeatures) ??
          fallback.suggestedFeatures,
        technicalApproach:
          normalizeAiText(parsed.technicalApproach) ??
          fallback.technicalApproach,
        estimatedComplexity:
          normalizeAiText(parsed.estimatedComplexity) ??
          fallback.estimatedComplexity,
        suggestedTimeline:
          normalizeAiText(parsed.suggestedTimeline) ??
          fallback.suggestedTimeline,
        questionsToAsk:
          normalizeAiText(parsed.questionsToAsk) ?? fallback.questionsToAsk,
      };
    } catch (error) {
      this.logger.warn(
        `${provider} error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return this.fallback.generate(input);
    }
  }
}
