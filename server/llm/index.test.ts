import { describe, expect, it } from 'vitest';
import { analyzeOrganization } from './index';
import type { LlmProvider } from './types';
import { PRESETS } from '../../src/data/presets';
import type { OrganizationProfile } from '../../src/types/strategy';

const govProfile: OrganizationProfile = {
  orgName: 'רשות בדיקה',
  orgType: 'government',
  sector: 'רגולציה',
  relevantEmployees: 300,
  avgHourlyCostIls: 150,
  sensitivity: 'high',
  cloudConstraint: 'nimbus',
  dataMaturity: 2,
  bottlenecks: ['אכיפה, רגולציה וציות'],
  freeTextContext: '',
};

function failingProvider(status: number, message: string): LlmProvider & { calls: number } {
  const p = {
    name: 'gemini' as const,
    calls: 0,
    async analyze() {
      p.calls++;
      throw Object.assign(new Error(message), { status });
    },
  };
  return p;
}

describe('analyzeOrganization', () => {
  it('returns the closest preset with origin=fallback when there is no provider', async () => {
    const r = await analyzeOrganization(govProfile, { provider: null });
    expect(r.origin).toBe('fallback');
    expect(r.presetId).toBe('corporations-authority');
    expect(r.initiatives.length).toBeGreaterThanOrEqual(3);
  });

  it('retries 3 times on 429 and then falls back to a preset, never throwing', async () => {
    const p = failingProvider(429, 'RESOURCE_EXHAUSTED: quota exceeded');
    const r = await analyzeOrganization(govProfile, { provider: p, baseDelayMs: 0 });
    expect(p.calls).toBe(3);
    expect(r.origin).toBe('fallback');
    expect(r.providerNote).toContain('מכסת');
  });

  it('does not retry on auth errors', async () => {
    const p = failingProvider(401, 'invalid API key');
    const r = await analyzeOrganization(govProfile, { provider: p, baseDelayMs: 0 });
    expect(p.calls).toBe(1);
    expect(r.origin).toBe('fallback');
  });

  it('rejects output that fails the schema and falls back', async () => {
    const p: LlmProvider = { name: 'claude', async analyze() { return { output: { executiveSummary: 'x' }, sources: [], model: 'm' }; } };
    const r = await analyzeOrganization(govProfile, { provider: p, baseDelayMs: 0, maxAttempts: 1 });
    expect(r.origin).toBe('fallback');
    expect(r.providerNote).toContain('סכמה');
  });

  it('returns origin=llm with valid output', async () => {
    const good = PRESETS[0].analysis;
    const p: LlmProvider = { name: 'claude', async analyze() { return { output: { executiveSummary: good.executiveSummary, initiatives: good.initiatives, kpis: good.kpis, governanceChecklist: good.governanceChecklist }, sources: [{ title: 't', uri: 'u' }], model: 'claude-test' }; } };
    const r = await analyzeOrganization(govProfile, { provider: p, baseDelayMs: 0 });
    expect(r.origin).toBe('llm');
    expect(r.sources).toHaveLength(1);
    expect(r.providerNote).toContain('claude-test');
  });

  it('every preset passes the LLM output schema (so presets and model output share one contract)', async () => {
    for (const preset of PRESETS) {
      const p: LlmProvider = { name: 'claude', async analyze() { return { output: preset.analysis, sources: [], model: 'm' }; } };
      const r = await analyzeOrganization(govProfile, { provider: p, baseDelayMs: 0, maxAttempts: 1 });
      expect(r.origin, preset.id).toBe('llm');
    }
  });
});
