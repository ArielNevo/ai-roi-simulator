import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { LlmProvider, ProviderResult } from './types';
import { LlmAnalysisOutputSchema } from '../../src/types/schema';

/**
 * Claude provider. One structured-output call via `messages.parse`, which
 * validates the response against the Zod schema before we ever see it.
 * Thinking is adaptive by default on Claude Opus 5.5; effort "high" because
 * this is a judgement task, not an extraction.
 */
export class ClaudeProvider implements LlmProvider {
  readonly name = 'claude' as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = process.env.CLAUDE_MODEL || 'claude-opus-5-5') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async analyze(_input: unknown, prompt: { system: string; user: string }): Promise<ProviderResult> {
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 16000,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      output_config: { format: zodOutputFormat(LlmAnalysisOutputSchema), effort: 'high' },
    });
    if (response.stop_reason === 'refusal') throw Object.assign(new Error('REFUSAL'), { status: 0 });
    if (!response.parsed_output) throw Object.assign(new Error('INVALID_OUTPUT: empty parsed_output'), { status: 0 });
    return { output: response.parsed_output, sources: [], model: this.model };
  }
}
