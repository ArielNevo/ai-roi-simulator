import type { StrategyAnalysisResult, OrganizationProfile } from '../../src/types/strategy';
import { LlmAnalysisOutputSchema } from '../../src/types/schema';
import { closestPreset } from '../../src/data/presets';
import { buildPrompt } from './prompt';
import type { LlmProvider } from './types';

export type ProviderName = 'gemini' | 'claude' | 'none';

export interface AnalyzeOptions {
  provider: LlmProvider | null;
  maxAttempts?: number;
  /** base delay in ms; doubles each attempt. Tests pass 0. */
  baseDelayMs?: number;
  log?: (msg: string) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function errorKind(e: unknown): 'rate-limit' | 'auth' | 'overloaded' | 'invalid-output' | 'other' {
  const msg = String((e as { message?: string })?.message ?? e ?? '');
  const status = Number((e as { status?: number })?.status ?? 0);
  if (status === 429 || /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) return 'rate-limit';
  if (status === 401 || status === 403 || /API key|PERMISSION_DENIED|authentication/i.test(msg)) return 'auth';
  if (status >= 500 || /UNAVAILABLE|overloaded|high demand|503|529/i.test(msg)) return 'overloaded';
  if (/ZOD|INVALID_OUTPUT|JSON/i.test(msg)) return 'invalid-output';
  return 'other';
}

/**
 * Run the provider with retries, validate the JSON, and fall back to the
 * closest preset when everything fails. Never throws on provider failure:
 * the user always gets a usable roadmap and an honest `origin` label.
 */
export async function analyzeOrganization(profile: OrganizationProfile, opts: AnalyzeOptions): Promise<StrategyAnalysisResult> {
  const log = opts.log ?? (() => {});
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelay = opts.baseDelayMs ?? 1500;
  const generatedAt = new Date().toISOString();

  if (!opts.provider) {
    const preset = closestPreset(profile);
    return {
      ...preset.analysis,
      generatedAt,
      origin: 'fallback',
      presetId: preset.id,
      providerNote: 'לא הוגדר ספק מודל (LLM_PROVIDER=none). מוצג התרחיש המובנה הקרוב ביותר לפרופיל שהזנת.',
    };
  }

  const prompt = buildPrompt(profile);
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`LLM attempt ${attempt}/${maxAttempts} via ${opts.provider.name}`);
      const result = await opts.provider.analyze({ profile }, prompt);
      const parsed = LlmAnalysisOutputSchema.safeParse(result.output);
      if (!parsed.success) {
        throw Object.assign(new Error('INVALID_OUTPUT: ' + parsed.error.issues.slice(0, 3).map((i) => i.path.join('.') + ' ' + i.message).join('; ')), { status: 0 });
      }
      return {
        ...parsed.data,
        sources: result.sources,
        generatedAt,
        origin: 'llm',
        providerNote: `נותח על ידי ${result.model}`,
      };
    } catch (e) {
      lastError = e;
      const kind = errorKind(e);
      log(`attempt ${attempt} failed (${kind}): ${String((e as Error)?.message ?? e).slice(0, 200)}`);
      if (kind === 'auth') break; // retrying an auth error is pointless
      if (attempt < maxAttempts) await sleep(baseDelay * Math.pow(2, attempt - 1));
    }
  }

  const preset = closestPreset(profile);
  const kind = errorKind(lastError);
  const reason: Record<ReturnType<typeof errorKind>, string> = {
    'rate-limit': 'חריגה ממכסת הקריאות של ספק המודל',
    auth: 'מפתח API חסר או לא תקין',
    overloaded: 'ספק המודל עמוס כרגע',
    'invalid-output': 'המודל החזיר פלט שאינו עומד בסכמה',
    other: 'שגיאה בקריאה למודל',
  };
  return {
    ...preset.analysis,
    generatedAt,
    origin: 'fallback',
    presetId: preset.id,
    providerNote: `${reason[kind]} (${maxAttempts} ניסיונות). מוצג התרחיש המובנה הקרוב ביותר: "${preset.title}". אפשר לנסות שוב מאוחר יותר.`,
  };
}
