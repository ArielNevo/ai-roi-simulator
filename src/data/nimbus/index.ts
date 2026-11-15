/**
 * Nimbus (the Israeli government cloud) reference data.
 *
 * Tier 1 ("רובד 1") = the native services of the two cloud providers (GCP, AWS)
 * that government bodies may consume directly: Vertex AI, Gemini on Vertex,
 * Document AI, BigQuery, Bedrock, Transcribe, Textract and so on.
 *
 * Tier 5 ("רובד 5") = third-party SaaS / software approved for purchase through
 * the Nimbus digital marketplace. The catalog below is parsed from the official
 * list dated 04.08.2026 (original spreadsheet in /data).
 */
import catalog from './tier5-services.json';

export type NimbusPlatform = 'GCP' | 'AWS';

export interface NimbusService {
  platform: NimbusPlatform;
  sku: string;
  supplier: string;
  vendor: string;
  name: string;
  description: string;
  serviceType: string;
  discountPct: number | null;
  approvedOn: string;
  rules: string;
  professionalServices: string;
  aiRelevant: boolean;
}

export type NimbusAiCategory =
  | 'genai-agents'
  | 'document-ai'
  | 'speech'
  | 'data-analytics'
  | 'automation-lowcode'
  | 'security-governance'
  | 'other';

export const NIMBUS_CATEGORY_LABELS: Record<NimbusAiCategory, string> = {
  'genai-agents': 'GenAI, צ\'אט וסוכנים',
  'document-ai': 'מסמכים ו-OCR',
  speech: 'תמלול ודיבור',
  'data-analytics': 'דאטה ואנליטיקה',
  'automation-lowcode': 'אוטומציה ו-Low-Code',
  'security-governance': 'אבטחה, התממה וממשל דאטה',
  other: 'אחר',
};

const RULES: Array<[NimbusAiCategory, RegExp]> = [
  ['genai-agents', /(סוכני|סוכן|AI Agents|agentic|RAG|צ'אט|chat|watsonx\.ai|watsonx Orchestrate|Wonderful|Workato|Enabley|Tabnine|Applitools|Conversational)/i],
  ['document-ai', /(מסמכ|Docs|OCR|ECM|Watson Discovery|DAM|Media|נכסים דיגיטליים)/i],
  ['speech', /(תמלול|Audio|Meeting Insights|MUST|Koldan|שיח קולי|VoiceSpin)/i],
  ['security-governance', /(התממה|DSPM|De-identification|governance|GRC|Risk|SecOps|Guardicore|SecuPi|Minereye|Data Protection)/i],
  ['automation-lowcode', /(Low[- ]Code|App Engine|Automation Engine|Integration Hub|Blink|OpenLegacy|אוטומציה של תהליכים)/i],
  ['data-analytics', /(BI\b|analytics|אנליטי|Data Platform|DataLake|אגם|Palantir|Elastic|Qlik|Grafana|Cloudera|Snowflake|Databricks|Informatica|Cognos|Planning Analytics|Upsolver|Dynatrace|Turbonomic|לוגים|watsonx\.data|Cloud Pak)/i],
];

export function categorize(s: NimbusService): NimbusAiCategory {
  const text = `${s.name} ${s.description}`;
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return 'other';
}

export const NIMBUS_SOURCE = catalog.source as string;
export const NIMBUS_SERVICES: NimbusService[] = catalog.services as NimbusService[];

export interface NimbusAiService extends NimbusService {
  category: NimbusAiCategory;
}

/** Services that matter for an AI roadmap (tighter than the raw `aiRelevant` flag). */
export const NIMBUS_AI_SERVICES: NimbusAiService[] = NIMBUS_SERVICES.filter((s) => s.aiRelevant)
  .map((s) => ({ ...s, category: categorize(s) }))
  .filter((s) => s.category !== 'other');

/** Case-insensitive search across name, vendor and description. */
export function searchNimbus(query: string, limit = 20): NimbusAiService[] {
  const q = query.trim().toLowerCase();
  if (!q) return NIMBUS_AI_SERVICES.slice(0, limit);
  return NIMBUS_AI_SERVICES.filter((s) =>
    [s.name, s.vendor, s.supplier, s.description].some((f) => f.toLowerCase().includes(q)),
  ).slice(0, limit);
}

/** Find tier-5 entries whose name or vendor contains any of the given tokens. */
export function matchNimbusByTokens(tokens: string[]): NimbusAiService[] {
  const seen = new Set<string>();
  const out: NimbusAiService[] = [];
  for (const t of tokens) {
    const q = t.toLowerCase();
    if (q.length < 3) continue;
    for (const s of NIMBUS_AI_SERVICES) {
      if (seen.has(s.sku)) continue;
      if (s.name.toLowerCase().includes(q) || s.vendor.toLowerCase().includes(q)) {
        seen.add(s.sku);
        out.push(s);
      }
    }
  }
  return out;
}

/** Tier-1 native services relevant to AI work, by platform. Hand-curated. */
export const NIMBUS_TIER1_AI = [
  { platform: 'GCP', name: 'Vertex AI (Gemini, Model Garden, Agent Builder)', useFor: 'מודלי שפה, RAG וסוכנים על דאטה ממשלתי בתוך גבולות הענן הממשלתי' },
  { platform: 'GCP', name: 'Document AI', useFor: 'OCR וחילוץ שדות מטפסים, דוחות ומסמכי רישום' },
  { platform: 'GCP', name: 'Speech-to-Text / Chirp', useFor: 'תמלול דיונים ושיחות בעברית' },
  { platform: 'GCP', name: 'BigQuery + BigQuery ML', useFor: 'אנליטיקה, זיהוי אנומליות ודיווח' },
  { platform: 'GCP', name: 'Dialogflow CX', useFor: 'בוטים לפניות ציבור' },
  { platform: 'AWS', name: 'Amazon Bedrock (Claude, Nova, Titan)', useFor: 'מודלי שפה וסוכנים בסביבה מבודדת' },
  { platform: 'AWS', name: 'Amazon Textract', useFor: 'OCR וחילוץ טבלאות מטפסים' },
  { platform: 'AWS', name: 'Amazon Transcribe', useFor: 'תמלול' },
  { platform: 'AWS', name: 'Amazon Kendra / OpenSearch', useFor: 'חיפוש ארגוני ו-RAG' },
  { platform: 'AWS', name: 'Amazon SageMaker', useFor: 'מודלים מותאמים וזיהוי אנומליות' },
] as const;

export function nimbusStats() {
  const byCat: Record<string, number> = {};
  for (const s of NIMBUS_AI_SERVICES) byCat[s.category] = (byCat[s.category] ?? 0) + 1;
  return { total: NIMBUS_SERVICES.length, ai: NIMBUS_AI_SERVICES.length, byCat };
}
