import { z } from 'zod';

export const DataSensitivitySchema = z.enum(['low', 'medium', 'high']);
export const OrgTypeSchema = z.enum(['government', 'academic', 'private', 'nonprofit']);
export const CloudConstraintSchema = z.enum(['none', 'nimbus', 'private-cloud', 'on-prem']);
export const BuyVsBuildSchema = z.enum(['buy', 'build', 'hybrid']);

export const OrganizationProfileSchema = z.object({
  orgName: z.string().min(1),
  orgType: OrgTypeSchema,
  sector: z.string().min(1),
  relevantEmployees: z.number().int().min(1).max(100000),
  avgHourlyCostIls: z.number().min(20).max(2000),
  sensitivity: DataSensitivitySchema,
  cloudConstraint: CloudConstraintSchema,
  dataMaturity: z.number().int().min(1).max(5),
  bottlenecks: z.array(z.string()).max(8),
  freeTextContext: z.string().max(8000).default(''),
  uploadedFileName: z.string().optional(),
  uploadedTextContent: z.string().max(60000).optional(),
});

export const ToolRecommendationSchema = z.object({
  category: z.string(),
  tools: z.array(z.string()).min(1).max(6),
  deployment: z.string().describe('איך הכלי נפרס: SaaS ציבורי / ענן ממשלתי נימבוס / ענן פרטי / מקומי'),
  privacyFitNote: z.string(),
  nimbusSkus: z.array(z.string()).optional().describe('מק"טים מקטלוג רובד 5 של נימבוס אם רלוונטי'),
});

export const InitiativeFinancialDefaultsSchema = z.object({
  affectedEmployeesShare: z.number().min(0.02).max(1),
  processTimeShare: z.number().min(0.03).max(0.7),
  adoptionRate: z.number().min(10).max(100),
  efficiencyGain: z.number().min(5).max(75),
  hitlOverhead: z.number().min(0).max(50),
  realizationRate: z.number().min(10).max(100),
  monthlyLicensePerUserIls: z.number().min(0).max(3000),
  oneTimeImplementationCostIls: z.number().min(0).max(20_000_000),
  trainingCostPerUserIls: z.number().min(0).max(20000),
  annualMaintenancePct: z.number().min(0).max(60),
});

export const RiskSchema = z.object({
  area: z.string(),
  risk: z.string(),
  mitigation: z.string(),
});

export const InitiativeSchema = z.object({
  id: z.string(),
  title: z.string(),
  problemAndSolution: z.string(),
  strategicRecommendation: BuyVsBuildSchema,
  recommendationRationale: z.string(),
  dataDependency: z.enum(['low', 'medium', 'high']).describe('כמה מהערך תלוי בדאטה פנימי ייחודי'),
  effortScore: z.number().min(1).max(10),
  impactScore: z.number().min(1).max(10),
  estimatedWeeks: z.number().int().min(2).max(78),
  recommendedTools: z.array(ToolRecommendationSchema).min(1).max(4),
  risks: z.array(RiskSchema).min(1).max(5),
  financialDefaults: InitiativeFinancialDefaultsSchema,
});

export const KpiItemSchema = z.object({
  id: z.string(),
  category: z.enum(['אימוץ', 'איכות ודיוק', 'עסקי ופיננסי']),
  metricName: z.string(),
  q1Target: z.string(),
  q2Target: z.string(),
  year1Target: z.string(),
  owner: z.string(),
});

export const GovernanceItemSchema = z.object({
  id: z.string(),
  category: z.enum(['אבטחת מידע ופרטיות', 'ממשל תאגידי ורגולציה', 'הכשרת עובדים ושינוי ארגוני']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['חובה', 'מומלץ']),
  completed: z.boolean(),
});

/** What the LLM must return. Everything else is added by the server. */
export const LlmAnalysisOutputSchema = z.object({
  executiveSummary: z.string(),
  initiatives: z.array(InitiativeSchema).min(3).max(7),
  kpis: z.array(KpiItemSchema).min(4).max(9),
  governanceChecklist: z.array(GovernanceItemSchema).min(3).max(8),
});

export const StrategyAnalysisResultSchema = LlmAnalysisOutputSchema.extend({
  sources: z.array(z.object({ title: z.string(), uri: z.string() })).default([]),
  generatedAt: z.string(),
  origin: z.enum(['preset', 'llm', 'fallback']),
  presetId: z.string().optional(),
  providerNote: z.string().optional(),
});

export const SimulationParamsSchema = z.object({
  adoptionRate: z.number().min(0).max(100),
  efficiencyGain: z.number().min(0).max(100),
  hitlOverhead: z.number().min(0).max(100),
  realizationRate: z.number().min(0).max(100),
  monthlyLicensePerUserIls: z.number().min(0),
  oneTimeImplementationCostIls: z.number().min(0),
  trainingCostPerUserIls: z.number().min(0),
  annualMaintenancePct: z.number().min(0).max(100),
  discountRatePct: z.number().min(0).max(30),
  rampMonths: z.number().int().min(1).max(36),
});
