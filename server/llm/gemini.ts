import { GoogleGenAI } from '@google/genai';
import type { LlmProvider, ProviderResult } from './types';
import { LlmAnalysisOutputSchema } from '../../src/types/schema';
import { z } from 'zod';

/**
 * Gemini provider. One structured-output call. Google Search grounding is not
 * combined with a response schema in the same request (the API does not allow
 * it), so grounding is deliberately left out: the prompt already carries the
 * curated catalog and the Nimbus list, which is more reliable for this task
 * than a web search anyway.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini' as const;
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = process.env.GEMINI_MODEL || 'gemini-2.5-pro') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async analyze(_input: unknown, prompt: { system: string; user: string }): Promise<ProviderResult> {
    const resp = await this.client.models.generateContent({
      model: this.model,
      contents: prompt.user,
      config: {
        systemInstruction: prompt.system,
        responseMimeType: 'application/json',
        responseJsonSchema: z.toJSONSchema(LlmAnalysisOutputSchema),
        temperature: 0.4,
      },
    });
    const text = (resp.text ?? '').trim();
    if (!text) throw new Error('EMPTY_RESPONSE');
    return { output: JSON.parse(text), sources: [], model: this.model };
  }
}
