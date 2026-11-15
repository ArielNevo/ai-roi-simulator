import type { LlmAnalysisOutput, OrganizationProfile } from '../../src/types/strategy';

export interface AnalysisInput {
  profile: OrganizationProfile;
}

export interface ProviderResult {
  output: unknown; // raw JSON from the model; validated by the caller
  sources: { title: string; uri: string }[];
  model: string;
}

export interface LlmProvider {
  readonly name: 'gemini' | 'claude';
  analyze(input: AnalysisInput, prompt: { system: string; user: string }): Promise<ProviderResult>;
}

export type ValidatedOutput = LlmAnalysisOutput;
