/**
 * Curated catalog of AI tool categories and products relevant to Israeli
 * organisations, with deployment options and privacy fit. Used three ways:
 *  1. shown to the user in Stage 2 and in the catalog drawer,
 *  2. passed to the LLM as grounding so recommendations stay inside what can
 *     actually be bought (including through Nimbus),
 *  3. matched against the Nimbus tier-5 list to show SKUs.
 */
import type { CloudConstraint, DataSensitivity } from '../types/strategy';

export type Deployment = 'public-saas' | 'enterprise-saas-zdr' | 'nimbus-tier1' | 'nimbus-tier5' | 'private-cloud' | 'on-prem';

export const DEPLOYMENT_LABELS: Record<Deployment, string> = {
  'public-saas': 'SaaS ציבורי',
  'enterprise-saas-zdr': 'SaaS ארגוני עם Zero Data Retention',
  'nimbus-tier1': 'נימבוס רובד 1 (שירות ענן נייטיב)',
  'nimbus-tier5': 'נימבוס רובד 5 (שוק דיגיטלי)',
  'private-cloud': 'ענן פרטי / VPC ייעודי',
  'on-prem': 'התקנה מקומית',
};

export interface CatalogTool {
  id: string;
  name: string;
  vendor: string;
  category: string;
  description: string;
  deployments: Deployment[];
  /** highest data sensitivity this tool is a reasonable fit for */
  maxSensitivity: DataSensitivity;
  /** tokens used to find matching Nimbus tier-5 SKUs */
  nimbusTokens?: string[];
  israeli?: boolean;
  typicalMonthlyPerUserIls?: number;
  bestFor: string[];
}

export const TOOL_CATALOG: CatalogTool[] = [
  { id: 'm365-copilot', name: 'Microsoft 365 Copilot', vendor: 'Microsoft', category: 'עוזר פרודוקטיביות רוחבי', description: 'סיכומים, ניסוח, Excel ו-Teams בתוך חבילת Office עם הגנות Enterprise.', deployments: ['enterprise-saas-zdr'], maxSensitivity: 'medium', typicalMonthlyPerUserIls: 115, bestFor: ['ניהול ידע, הדרכה ותפעול', 'כספים, רכש ובקרה', 'שיווק, מכירות וגיוס'] },
  { id: 'gemini-workspace', name: 'Gemini for Google Workspace', vendor: 'Google', category: 'עוזר פרודוקטיביות רוחבי', description: 'Gemini בתוך Gmail, Docs, Meet ו-NotebookLM Enterprise. זמין גם דרך נימבוס GCP.', deployments: ['enterprise-saas-zdr', 'nimbus-tier1'], maxSensitivity: 'medium', typicalMonthlyPerUserIls: 95, bestFor: ['ניהול ידע, הדרכה ותפעול', 'מחקר, כתיבה אקדמית והוראה'] },
  { id: 'chatgpt-enterprise', name: 'ChatGPT Enterprise / Claude for Enterprise', vendor: 'OpenAI / Anthropic', category: 'עוזר כללי ארגוני', description: 'צ\'אט ארגוני עם SSO, Zero Data Retention חוזי ואי-אימון על הנתונים.', deployments: ['enterprise-saas-zdr'], maxSensitivity: 'medium', typicalMonthlyPerUserIls: 110, bestFor: ['ניתוח מסמכים, חוזים ותיקים', 'מחקר, כתיבה אקדמית והוראה'] },
  { id: 'vertex-gemini', name: 'Gemini on Vertex AI', vendor: 'Google Cloud', category: 'פלטפורמת מודלים (Build)', description: 'מודלי Gemini, RAG Engine ו-Agent Builder בתוך הפרויקט של הארגון. הבסיס לפיתוח בנימבוס GCP.', deployments: ['nimbus-tier1', 'private-cloud'], maxSensitivity: 'high', bestFor: ['שירות לקוחות ופניות ציבור', 'ניתוח מסמכים, חוזים ותיקים', 'אכיפה, רגולציה וציות'] },
  { id: 'bedrock', name: 'Claude / Nova on Amazon Bedrock', vendor: 'AWS', category: 'פלטפורמת מודלים (Build)', description: 'מודלים מנוהלים בתוך ה-VPC של הארגון, Guardrails ו-Knowledge Bases. הבסיס לפיתוח בנימבוס AWS.', deployments: ['nimbus-tier1', 'private-cloud'], maxSensitivity: 'high', bestFor: ['שירות לקוחות ופניות ציבור', 'ניתוח מסמכים, חוזים ותיקים'] },
  { id: 'azure-openai', name: 'Azure OpenAI (Private Endpoint)', vendor: 'Microsoft', category: 'פלטפורמת מודלים (Build)', description: 'GPT בתוך מנוי Azure של הארגון, ללא שמירת פרומפטים. לא זמין בנימבוס.', deployments: ['private-cloud'], maxSensitivity: 'high', bestFor: ['ניתוח מסמכים, חוזים ותיקים', 'כתיבת קוד ו-IT'] },
  { id: 'document-ai', name: 'Document AI / Amazon Textract', vendor: 'Google Cloud / AWS', category: 'עיבוד מסמכים ו-OCR', description: 'חילוץ שדות, טבלאות וחתימות מטפסים ודוחות סרוקים.', deployments: ['nimbus-tier1', 'private-cloud'], maxSensitivity: 'high', bestFor: ['ניתוח מסמכים, חוזים ותיקים', 'כספים, רכש ובקרה', 'אכיפה, רגולציה וציות'] },
  { id: 'kal-docs', name: 'Kal-Docs', vendor: 'בינת תקשורת מחשבים', category: 'עיבוד מסמכים ו-OCR', description: 'אוטומציה של ניהול מסמכים וחילוץ מידע, מאושר ברובד 5 (GCP). מתאים לרשויות ממשלתיות.', deployments: ['nimbus-tier5'], maxSensitivity: 'high', nimbusTokens: ['Kal-Docs'], israeli: true, bestFor: ['ניתוח מסמכים, חוזים ותיקים', 'אכיפה, רגולציה וציות'] },
  { id: 'kal-chat', name: 'Kal-Chat', vendor: 'בינת תקשורת מחשבים', category: 'צ\'אט ארגוני על מאגרי ידע (RAG)', description: 'צ\'אט מבוסס AI לתשאול מאגרי מידע ארגוניים, מאושר ברובד 5 (GCP).', deployments: ['nimbus-tier5'], maxSensitivity: 'high', nimbusTokens: ['Kal-Chat'], israeli: true, bestFor: ['שירות לקוחות ופניות ציבור', 'ניהול ידע, הדרכה ותפעול'] },
  { id: 'nuclia', name: 'Progress Agentic RAG (Nuclia)', vendor: 'Progress / Nuclia', category: 'צ\'אט ארגוני על מאגרי ידע (RAG)', description: 'בניית סוכני RAG על הידע הארגוני, מאושר ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'private-cloud'], maxSensitivity: 'high', nimbusTokens: ['Nuclia', 'Agentic RAG'], bestFor: ['ניהול ידע, הדרכה ותפעול', 'שירות לקוחות ופניות ציבור'] },
  { id: 'wonderful', name: 'Wonderful', vendor: 'Wonderful Systems', category: 'סוכני AI לשירות', description: 'פלטפורמה ישראלית להקמת סוכני AI לשירות לקוחות בעברית, מאושרת ברובד 5 (GCP ו-AWS).', deployments: ['nimbus-tier5', 'enterprise-saas-zdr'], maxSensitivity: 'medium', nimbusTokens: ['Wonderful'], israeli: true, bestFor: ['שירות לקוחות ופניות ציבור'] },
  { id: 'must', name: 'MUST (Sumit-AI)', vendor: 'Sumit-AI', category: 'תמלול וסיכום שיחות', description: 'תמלול שיח קולי בעברית וניתוחו, מאושר ברובד 5 (GCP ו-AWS).', deployments: ['nimbus-tier5'], maxSensitivity: 'high', nimbusTokens: ['MUST', 'Must NS'], israeli: true, bestFor: ['אכיפה, רגולציה וציות', 'שירות לקוחות ופניות ציבור'] },
  { id: 'koldan', name: 'Koldan (Dixilang) / Meeting Insights', vendor: 'Dixilang / AudioCodes', category: 'תמלול וסיכום שיחות', description: 'תמלול מאובטח של דיונים, פגישות והקלטות, כולל On-Prem. מאושר ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'on-prem'], maxSensitivity: 'high', nimbusTokens: ['Koldan', 'Meeting Insights'], israeli: true, bestFor: ['אכיפה, רגולציה וציות', 'ניהול ידע, הדרכה ותפעול'] },
  { id: 'harvey', name: 'Harvey / Spellbook', vendor: 'Harvey AI / Spellbook', category: 'AI משפטי: חוזים וסקירת מסמכים', description: 'סקירת חוזים, ניסוח וניתוח תיקים למשרדי עורכי דין ומחלקות משפטיות, עם הסכמי סודיות ו-ZDR.', deployments: ['enterprise-saas-zdr'], maxSensitivity: 'medium', typicalMonthlyPerUserIls: 450, bestFor: ['ניתוח מסמכים, חוזים ותיקים'] },
  { id: 'nevo-ai', name: 'נבו AI / תקדין AI / דינים', vendor: 'מאגרים משפטיים ישראליים', category: 'AI משפטי: מחקר ופסיקה', description: 'מחקר משפטי בעברית על פסיקה וחקיקה ישראלית עם סיכומי AI וציטוטים מאומתים.', deployments: ['public-saas'], maxSensitivity: 'low', israeli: true, typicalMonthlyPerUserIls: 300, bestFor: ['ניתוח מסמכים, חוזים ותיקים', 'אכיפה, רגולציה וציות'] },
  { id: 'servicenow-legal', name: 'ServiceNow Legal Service Delivery', vendor: 'ServiceNow (Bynet)', category: 'ניהול שירותים משפטיים', description: 'ניהול בקשות משפטיות, SLA ואוטומציה, מאושר ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'enterprise-saas-zdr'], maxSensitivity: 'high', nimbusTokens: ['Legal Service Delivery'], bestFor: ['אכיפה, רגולציה וציות', 'ניהול ידע, הדרכה ותפעול'] },
  { id: 'github-copilot', name: 'GitHub Copilot Enterprise / Tabnine', vendor: 'GitHub / Tabnine', category: 'עוזר קוד', description: 'עוזר קוד ארגוני. Tabnine מאושר ברובד 5 (GCP) כולל הרצה בתוך גבולות הארגון.', deployments: ['enterprise-saas-zdr', 'nimbus-tier5', 'on-prem'], maxSensitivity: 'high', nimbusTokens: ['Tabnine'], typicalMonthlyPerUserIls: 140, bestFor: ['כתיבת קוד ו-IT'] },
  { id: 'claude-code', name: 'Claude Code / Cursor', vendor: 'Anthropic / Anysphere', category: 'סוכן פיתוח', description: 'סוכני קוד אוטונומיים לצוותי פיתוח, עם Zero Data Retention בחוזה ארגוני.', deployments: ['enterprise-saas-zdr', 'private-cloud'], maxSensitivity: 'medium', typicalMonthlyPerUserIls: 400, bestFor: ['כתיבת קוד ו-IT'] },
  { id: 'elicit', name: 'Elicit / Consensus / Scite / NotebookLM', vendor: 'שונים', category: 'מחקר אקדמי וסקירת ספרות', description: 'סקירות ספרות, חילוץ ממצאים ממאמרים וציטוטים מאומתים לחוקרים.', deployments: ['public-saas', 'enterprise-saas-zdr'], maxSensitivity: 'low', typicalMonthlyPerUserIls: 60, bestFor: ['מחקר, כתיבה אקדמית והוראה'] },
  { id: 'lms-ai', name: 'עוזרי הוראה ב-LMS (Moodle AI / Canvas / Gemini for Education)', vendor: 'שונים', category: 'הוראה ולמידה', description: 'עוזרי הוראה על חומרי הקורס, בוחנים אוטומטיים, משוב על מטלות ואנליטיקת למידה.', deployments: ['enterprise-saas-zdr', 'private-cloud'], maxSensitivity: 'medium', typicalMonthlyPerUserIls: 40, bestFor: ['מחקר, כתיבה אקדמית והוראה'] },
  { id: 'enabley', name: 'Enabley', vendor: 'Enabley', category: 'הדרכה וניהול ידע', description: 'פלטפורמה ישראלית להדרכה, למידה וניהול ידע מבוססת AI, מאושרת ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'enterprise-saas-zdr'], maxSensitivity: 'medium', nimbusTokens: ['Enabley'], israeli: true, bestFor: ['ניהול ידע, הדרכה ותפעול'] },
  { id: 'workato', name: 'Workato / Blink / ServiceNow App Engine', vendor: 'שונים', category: 'אוטומציה ו-Low-Code עם AI', description: 'אוטומציית תהליכים עם סוכני AI, מאושר ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'enterprise-saas-zdr'], maxSensitivity: 'medium', nimbusTokens: ['Workato', 'Blink', 'App Engine', 'Automation Engine'], bestFor: ['כספים, רכש ובקרה', 'ניהול ידע, הדרכה ותפעול'] },
  { id: 'watsonx', name: 'IBM watsonx (ai / Orchestrate / governance)', vendor: 'IBM', category: 'פלטפורמת סוכנים וממשל AI', description: 'סוכנים, מודלים וממשל AI, כולל רכיב governance, מאושר ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'on-prem'], maxSensitivity: 'high', nimbusTokens: ['watsonx'], bestFor: ['אכיפה, רגולציה וציות', 'כספים, רכש ובקרה'] },
  { id: 'bigquery-ml', name: 'BigQuery ML / SageMaker / SAS Viya', vendor: 'Google / AWS / SAS', category: 'אנליטיקה וזיהוי אנומליות', description: 'מודלים על דאטה מובנה: חיזוי, זיהוי חריגות ותעדוף אכיפה. SAS Viya מאושר ברובד 5.', deployments: ['nimbus-tier1', 'nimbus-tier5', 'private-cloud'], maxSensitivity: 'high', nimbusTokens: ['SAS Viya', 'Palantir'], bestFor: ['אכיפה, רגולציה וציות', 'כספים, רכש ובקרה'] },
  { id: 'secupi', name: 'SecuPi / Minereye DataTracker', vendor: 'SecuPi / קום אייטי', category: 'התממה וסיווג מידע לפני AI', description: 'גילוי, סיווג והתממת PII לפני שמידע מוזן למודלים. מאושר ברובד 5 (AWS).', deployments: ['nimbus-tier5', 'on-prem'], maxSensitivity: 'high', nimbusTokens: ['SecuPi', 'Minereye'], israeli: true, bestFor: ['אכיפה, רגולציה וציות', 'ניתוח מסמכים, חוזים ותיקים'] },
  { id: 'ollama', name: 'מודלים פתוחים מקומיים (Llama / Gemma / Mistral על vLLM)', vendor: 'קוד פתוח', category: 'פלטפורמת מודלים (On-Prem)', description: 'הרצת מודלים פתוחים על חומרה של הארגון. מתאים למידע מסווג או כשאין חוזה ענן.', deployments: ['on-prem'], maxSensitivity: 'high', bestFor: ['ניתוח מסמכים, חוזים ותיקים', 'ניהול ידע, הדרכה ותפעול'] },
];

const SENS_RANK: Record<DataSensitivity, number> = { low: 0, medium: 1, high: 2 };

/** Is a deployment option acceptable under the organisation's cloud constraint? */
export function deploymentAllowed(d: Deployment, constraint: CloudConstraint): boolean {
  switch (constraint) {
    case 'none': return true;
    case 'nimbus': return d === 'nimbus-tier1' || d === 'nimbus-tier5' || d === 'on-prem';
    case 'private-cloud': return d !== 'public-saas';
    case 'on-prem': return d === 'on-prem';
  }
}

export function toolFits(tool: CatalogTool, sensitivity: DataSensitivity, constraint: CloudConstraint): { fits: boolean; reason: string } {
  const allowedDeployments = tool.deployments.filter((d) => deploymentAllowed(d, constraint));
  if (allowedDeployments.length === 0) return { fits: false, reason: `אין אופציית פריסה שעומדת במגבלת הענן (${constraint === 'nimbus' ? 'נימבוס' : constraint})` };
  if (SENS_RANK[tool.maxSensitivity] < SENS_RANK[sensitivity]) return { fits: false, reason: 'רמת רגישות המידע גבוהה מהמתאים לכלי זה' };
  return { fits: true, reason: allowedDeployments.map((d) => DEPLOYMENT_LABELS[d]).join(' · ') };
}

export function toolsForBottlenecks(bottlenecks: string[], sensitivity: DataSensitivity, constraint: CloudConstraint): CatalogTool[] {
  return TOOL_CATALOG.filter((t) => t.bestFor.some((b) => bottlenecks.includes(b)) && toolFits(t, sensitivity, constraint).fits);
}

/** Compact text rendering for LLM grounding. */
export function catalogForPrompt(sensitivity: DataSensitivity, constraint: CloudConstraint): string {
  return TOOL_CATALOG.map((t) => {
    const fit = toolFits(t, sensitivity, constraint);
    return `- ${t.name} (${t.vendor}) | ${t.category} | פריסה: ${t.deployments.map((d) => DEPLOYMENT_LABELS[d]).join(', ')} | רגישות מקסימלית: ${t.maxSensitivity} | ${fit.fits ? 'מתאים' : 'לא מתאים: ' + fit.reason}`;
  }).join('\n');
}
