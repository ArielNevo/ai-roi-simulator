import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OrganizationProfileSchema } from '../src/types/schema';
import { analyzeOrganization } from './llm';
import type { LlmProvider } from './llm/types';
import { GeminiProvider } from './llm/gemini';
import { ClaudeProvider } from './llm/claude';
import { NIMBUS_AI_SERVICES, nimbusStats } from '../src/data/nimbus';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

function makeProvider(): { provider: LlmProvider | null; label: string } {
  const choice = (process.env.LLM_PROVIDER || 'none').toLowerCase();
  if (choice === 'gemini' && process.env.GEMINI_API_KEY) return { provider: new GeminiProvider(process.env.GEMINI_API_KEY), label: 'gemini' };
  if (choice === 'claude' && process.env.ANTHROPIC_API_KEY) return { provider: new ClaudeProvider(process.env.ANTHROPIC_API_KEY), label: 'claude' };
  if (choice !== 'none') console.warn(`LLM_PROVIDER=${choice} but no API key found; running in presets-only mode.`);
  return { provider: null, label: 'none' };
}

const { provider, label } = makeProvider();
const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: label, nimbus: nimbusStats() });
});

app.get('/api/nimbus', (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  const list = q
    ? NIMBUS_AI_SERVICES.filter((s) => [s.name, s.vendor, s.description].some((f) => f.toLowerCase().includes(q)))
    : NIMBUS_AI_SERVICES;
  res.json({ count: list.length, services: list.slice(0, 100) });
});

app.post('/api/analyze', async (req, res) => {
  const parsed = OrganizationProfileSchema.safeParse(req.body?.profile);
  if (!parsed.success) {
    res.status(400).json({ error: 'פרופיל הארגון חסר או לא תקין: ' + parsed.error.issues.map((i) => i.path.join('.')).join(', ') });
    return;
  }
  try {
    const result = await analyzeOrganization(parsed.data, { provider, log: (m) => console.log('[analyze]', m) });
    res.json(result);
  } catch (e) {
    console.error('[analyze] unexpected', e);
    res.status(500).json({ error: 'שגיאה בלתי צפויה בשרת. נסה שוב.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (provider: ${label})`);
});
