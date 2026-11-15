/**
 * Shared domain types. The Zod schemas in ./schema.ts are the single source of
 * truth for validation; these types are inferred from them so the client, the
 * server and the LLM output contract can never drift apart.
 */
import type { z } from 'zod';
import type {
  BuyVsBuildSchema,
  DataSensitivitySchema,
  OrgTypeSchema,
  CloudConstraintSchema,
  OrganizationProfileSchema,
  InitiativeSchema,
  InitiativeFinancialDefaultsSchema,
  ToolRecommendationSchema,
  KpiItemSchema,
  GovernanceItemSchema,
  StrategyAnalysisResultSchema,
  LlmAnalysisOutputSchema,
  SimulationParamsSchema,
} from './schema';

export type DataSensitivity = z.infer<typeof DataSensitivitySchema>;
export type OrgType = z.infer<typeof OrgTypeSchema>;
export type CloudConstraint = z.infer<typeof CloudConstraintSchema>;
export type BuyVsBuild = z.infer<typeof BuyVsBuildSchema>;
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;
export type ToolRecommendation = z.infer<typeof ToolRecommendationSchema>;
export type InitiativeFinancialDefaults = z.infer<typeof InitiativeFinancialDefaultsSchema>;
export type Initiative = z.infer<typeof InitiativeSchema>;
export type KpiItem = z.infer<typeof KpiItemSchema>;
export type GovernanceItem = z.infer<typeof GovernanceItemSchema>;
export type StrategyAnalysisResult = z.infer<typeof StrategyAnalysisResultSchema>;
export type LlmAnalysisOutput = z.infer<typeof LlmAnalysisOutputSchema>;
export type SimulationParams = z.infer<typeof SimulationParamsSchema>;

/** Where a number on screen came from. Every displayed parameter carries one. */
export type ParamSource = 'user' | 'default' | 'market';

export type WorkflowStage = 1 | 2 | 3 | 4;

export const BOTTLENECK_OPTIONS = [
  'שירות לקוחות ופניות ציבור',
  'ניתוח מסמכים, חוזים ותיקים',
  'כתיבת קוד ו-IT',
  'כספים, רכש ובקרה',
  'שיווק, מכירות וגיוס',
  'ניהול ידע, הדרכה ותפעול',
  'מחקר, כתיבה אקדמית והוראה',
  'אכיפה, רגולציה וציות',
] as const;

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  government: 'משרד ממשלתי / רשות',
  academic: 'אקדמיה / מוסד להשכלה גבוהה',
  private: 'חברה פרטית / משרד מקצועי',
  nonprofit: 'מלכ"ר / מגזר שלישי',
};

export const CLOUD_CONSTRAINT_LABELS: Record<CloudConstraint, string> = {
  none: 'ללא מגבלה (ענן ציבורי מאושר)',
  nimbus: 'נימבוס (ענן ממשלתי) בלבד',
  'private-cloud': 'ענן פרטי / Zero Data Retention חוזי',
  'on-prem': 'מקומי (On-Prem) בלבד',
};

export const SENSITIVITY_LABELS: Record<DataSensitivity, { title: string; sub: string }> = {
  low: { title: 'נמוכה', sub: 'מידע שגרתי · SaaS סטנדרטי' },
  medium: { title: 'בינונית', sub: 'IP עסקי · Zero Retention / SOC2' },
  high: { title: 'גבוהה', sub: 'PII / פרטיות מחמירה / סיווג' },
};

export const BUY_BUILD_LABELS: Record<BuyVsBuild, string> = {
  buy: 'רכישת מוצר מדף',
  build: 'פיתוח מותאם / סוכן',
  hybrid: 'שילוב היברידי',
};
