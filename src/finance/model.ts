/**
 * Pure financial model. No React, no I/O, no LLM.
 *
 * Core idea: AI saves *hours*. Hours become *money* only through a realization
 * rate (headcount not hired, overtime cut, vendors replaced, SLA penalties
 * avoided). We therefore report both:
 *   - soft value: gross hours freed × hourly cost
 *   - hard value: soft value × realization rate   <- everything financial uses this
 *
 * Costs: one-time implementation + training (month 0), monthly licences per
 * active user, and ongoing maintenance as a % of implementation cost per year.
 * Adoption follows a smoothstep S-curve over `rampMonths`.
 */
import type { Initiative, OrganizationProfile, SimulationParams } from '../types/strategy';

export const MONTHLY_HOURS_PER_FTE = 173;
export const HORIZON_MONTHS = 36;

export const SENSITIVITY_ADOPTION_STEPS = [10, 25, 40, 60, 80, 100] as const;
export const SENSITIVITY_EFFICIENCY_STEPS = [5, 15, 25, 35, 50] as const;

export const DEFAULT_PARAMS: SimulationParams = {
  adoptionRate: 60,
  efficiencyGain: 25,
  hitlOverhead: 15,
  realizationRate: 40,
  monthlyLicensePerUserIls: 110,
  oneTimeImplementationCostIls: 150_000,
  trainingCostPerUserIls: 1_200,
  annualMaintenancePct: 10,
  discountRatePct: 8,
  rampMonths: 12,
};

export interface Scope {
  /** share of relevantEmployees touched by the initiative (0..1) */
  affectedShare: number;
  /** share of those employees' hours spent on the addressable process (0..1) */
  processTimeShare: number;
}

export interface MonthPoint {
  month: number;
  hoursSaved: number;
  softValue: number;
  hardValue: number;
  licenseCost: number;
  maintenanceCost: number;
  net: number;
  cumulative: number;
  discountedCumulative: number;
}

export interface ScenarioResult {
  affectedEmployees: number;
  activeUsers: number;
  oneTimeCost: number;
  trainingCost: number;
  monthlyHoursSavedSteady: number;
  monthlySoftValueSteady: number;
  monthlyHardValueSteady: number;
  monthlyLicenseCostSteady: number;
  monthlyMaintenanceCost: number;
  monthlyNetSteady: number;
  totalHoursSaved3y: number;
  totalSoftValue3y: number;
  totalHardValue3y: number;
  totalCost3y: number;
  netValue3y: number;
  npv3y: number;
  /** (hard value − total cost) / total cost over 3 years, in % */
  roi3yPct: number;
  /** roi3yPct / 3, in % */
  annualizedRoiPct: number;
  /** first month where cumulative ≥ 0, or null if never within horizon */
  paybackMonth: number | null;
  series: MonthPoint[];
}

export interface SimulationResult {
  base: ScenarioResult;
  optimistic: ScenarioResult;
  pessimistic: ScenarioResult;
  scope: Scope;
}

export interface SensitivityCell {
  adoptionRate: number;
  efficiencyGain: number;
  roi3yPct: number;
  netValue3y: number;
  paybackMonth: number | null;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Smoothstep S-curve: 0 at month 0, 1 at month >= rampMonths. */
export function rampFactor(month: number, rampMonths: number): number {
  if (month <= 0) return 0;
  if (month >= rampMonths) return 1;
  const t = month / rampMonths;
  return t * t * (3 - 2 * t);
}

export function getScope(initiatives: Initiative[], selectedId: string | 'PORTFOLIO'): Scope {
  if (initiatives.length === 0) return { affectedShare: 0.5, processTimeShare: 0.2 };
  if (selectedId !== 'PORTFOLIO') {
    const found = initiatives.find((i) => i.id === selectedId) ?? initiatives[0];
    return {
      affectedShare: clamp(found.financialDefaults.affectedEmployeesShare, 0.02, 1),
      processTimeShare: clamp(found.financialDefaults.processTimeShare, 0.03, 0.7),
    };
  }
  // Portfolio: sum of (affected × process share) is the organisation-wide
  // addressable share of hours. Hard cap at 45% — nobody automates more than
  // that in three years, whatever the slide deck says.
  const exposure = initiatives.reduce(
    (acc, i) => acc + i.financialDefaults.affectedEmployeesShare * i.financialDefaults.processTimeShare,
    0,
  );
  return { affectedShare: 1, processTimeShare: clamp(exposure, 0.05, 0.45) };
}

export function getDefaultParams(
  initiatives: Initiative[],
  selectedId: string | 'PORTFOLIO',
): SimulationParams {
  if (initiatives.length === 0) return { ...DEFAULT_PARAMS };
  const pick = (list: Initiative[]) => {
    const n = list.length;
    const avg = (f: (i: Initiative) => number) => list.reduce((a, i) => a + f(i), 0) / n;
    return {
      adoptionRate: Math.round(avg((i) => i.financialDefaults.adoptionRate)),
      efficiencyGain: Math.round(avg((i) => i.financialDefaults.efficiencyGain)),
      hitlOverhead: Math.round(avg((i) => i.financialDefaults.hitlOverhead)),
      realizationRate: Math.round(avg((i) => i.financialDefaults.realizationRate)),
      monthlyLicensePerUserIls: Math.round(avg((i) => i.financialDefaults.monthlyLicensePerUserIls)),
      oneTimeImplementationCostIls: Math.round(
        list.reduce((a, i) => a + i.financialDefaults.oneTimeImplementationCostIls, 0),
      ),
      trainingCostPerUserIls: Math.round(avg((i) => i.financialDefaults.trainingCostPerUserIls)),
      annualMaintenancePct: Math.round(avg((i) => i.financialDefaults.annualMaintenancePct)),
      discountRatePct: DEFAULT_PARAMS.discountRatePct,
      rampMonths: DEFAULT_PARAMS.rampMonths,
    };
  };
  if (selectedId === 'PORTFOLIO') return pick(initiatives);
  const found = initiatives.find((i) => i.id === selectedId) ?? initiatives[0];
  return pick([found]);
}

export function computeScenario(
  profile: Pick<OrganizationProfile, 'relevantEmployees' | 'avgHourlyCostIls'>,
  scope: Scope,
  params: SimulationParams,
): ScenarioResult {
  const affectedEmployees = Math.max(1, Math.round(profile.relevantEmployees * scope.affectedShare));
  const adoption = clamp(params.adoptionRate, 0, 100) / 100;
  const efficiency = clamp(params.efficiencyGain, 0, 100) / 100;
  const hitl = clamp(params.hitlOverhead, 0, 100) / 100;
  const realization = clamp(params.realizationRate, 0, 100) / 100;
  const activeUsers = Math.round(affectedEmployees * adoption);

  const addressableHours = affectedEmployees * MONTHLY_HOURS_PER_FTE * scope.processTimeShare;
  const monthlyHoursSavedSteady = addressableHours * adoption * efficiency * (1 - hitl);
  const monthlySoftValueSteady = monthlyHoursSavedSteady * profile.avgHourlyCostIls;
  const monthlyHardValueSteady = monthlySoftValueSteady * realization;
  const monthlyLicenseCostSteady = activeUsers * Math.max(0, params.monthlyLicensePerUserIls);
  const implementation = Math.max(0, params.oneTimeImplementationCostIls);
  const trainingCost = activeUsers * Math.max(0, params.trainingCostPerUserIls);
  const oneTimeCost = implementation + trainingCost;
  const monthlyMaintenanceCost = (implementation * clamp(params.annualMaintenancePct, 0, 100)) / 100 / 12;
  const monthlyNetSteady = monthlyHardValueSteady - monthlyLicenseCostSteady - monthlyMaintenanceCost;

  const monthlyDiscount = 1 + clamp(params.discountRatePct, 0, 100) / 100 / 12;
  const series: MonthPoint[] = [];
  let cumulative = -oneTimeCost;
  let discountedCumulative = -oneTimeCost;
  series.push({
    month: 0, hoursSaved: 0, softValue: 0, hardValue: 0, licenseCost: 0,
    maintenanceCost: 0, net: -oneTimeCost, cumulative, discountedCumulative,
  });
  let totalHoursSaved3y = 0;
  let totalSoftValue3y = 0;
  let totalHardValue3y = 0;
  let totalLicense3y = 0;
  let totalMaintenance3y = 0;
  let paybackMonth: number | null = null;

  for (let m = 1; m <= HORIZON_MONTHS; m++) {
    const ramp = rampFactor(m, params.rampMonths);
    // Seats are provisioned ahead of usage: at least half the licences are paid
    // from month 1 even when adoption is still climbing.
    const seatRamp = Math.max(0.5, ramp);
    const hoursSaved = monthlyHoursSavedSteady * ramp;
    const softValue = monthlySoftValueSteady * ramp;
    const hardValue = monthlyHardValueSteady * ramp;
    const licenseCost = monthlyLicenseCostSteady * seatRamp;
    const maintenanceCost = monthlyMaintenanceCost;
    const net = hardValue - licenseCost - maintenanceCost;
    cumulative += net;
    discountedCumulative += net / Math.pow(monthlyDiscount, m);
    totalHoursSaved3y += hoursSaved;
    totalSoftValue3y += softValue;
    totalHardValue3y += hardValue;
    totalLicense3y += licenseCost;
    totalMaintenance3y += maintenanceCost;
    if (paybackMonth === null && cumulative >= 0) paybackMonth = m;
    series.push({ month: m, hoursSaved, softValue, hardValue, licenseCost, maintenanceCost, net, cumulative, discountedCumulative });
  }

  const totalCost3y = oneTimeCost + totalLicense3y + totalMaintenance3y;
  const netValue3y = totalHardValue3y - totalCost3y;
  const roi3yPct = totalCost3y > 0 ? (netValue3y / totalCost3y) * 100 : netValue3y > 0 ? 999 : 0;

  return {
    affectedEmployees,
    activeUsers,
    oneTimeCost,
    trainingCost,
    monthlyHoursSavedSteady,
    monthlySoftValueSteady,
    monthlyHardValueSteady,
    monthlyLicenseCostSteady,
    monthlyMaintenanceCost,
    monthlyNetSteady,
    totalHoursSaved3y,
    totalSoftValue3y,
    totalHardValue3y,
    totalCost3y,
    netValue3y,
    npv3y: discountedCumulative,
    roi3yPct,
    annualizedRoiPct: roi3yPct / 3,
    paybackMonth,
    series,
  };
}

export function optimisticParams(p: SimulationParams): SimulationParams {
  return {
    ...p,
    adoptionRate: clamp(p.adoptionRate + 15, 0, 100),
    efficiencyGain: clamp(p.efficiencyGain + 10, 0, 100),
    hitlOverhead: clamp(p.hitlOverhead - 5, 0, 100),
    realizationRate: clamp(p.realizationRate + 15, 0, 100),
    oneTimeImplementationCostIls: Math.round(p.oneTimeImplementationCostIls * 0.9),
    rampMonths: Math.max(1, Math.round(p.rampMonths * 0.75)),
  };
}

export function pessimisticParams(p: SimulationParams): SimulationParams {
  return {
    ...p,
    adoptionRate: clamp(p.adoptionRate - 20, 0, 100),
    efficiencyGain: clamp(p.efficiencyGain - 10, 0, 100),
    hitlOverhead: clamp(p.hitlOverhead + 10, 0, 100),
    realizationRate: clamp(p.realizationRate - 15, 0, 100),
    monthlyLicensePerUserIls: Math.round(p.monthlyLicensePerUserIls * 1.1),
    oneTimeImplementationCostIls: Math.round(p.oneTimeImplementationCostIls * 1.25),
    rampMonths: Math.min(36, Math.round(p.rampMonths * 1.5)),
  };
}

export function simulate(
  profile: Pick<OrganizationProfile, 'relevantEmployees' | 'avgHourlyCostIls'>,
  initiatives: Initiative[],
  selectedId: string | 'PORTFOLIO',
  params: SimulationParams,
): SimulationResult {
  const scope = getScope(initiatives, selectedId);
  return {
    scope,
    base: computeScenario(profile, scope, params),
    optimistic: computeScenario(profile, scope, optimisticParams(params)),
    pessimistic: computeScenario(profile, scope, pessimisticParams(params)),
  };
}

/**
 * Sensitivity grid: rows = efficiency gain, columns = adoption rate.
 * If no cell is negative the grid is extended with a harsher row/column so the
 * reader always sees where the plan breaks.
 */
export function sensitivityMatrix(
  profile: Pick<OrganizationProfile, 'relevantEmployees' | 'avgHourlyCostIls'>,
  initiatives: Initiative[],
  selectedId: string | 'PORTFOLIO',
  params: SimulationParams,
): { adoptionSteps: number[]; efficiencySteps: number[]; rows: SensitivityCell[][] } {
  const scope = getScope(initiatives, selectedId);
  let adoptionSteps: number[] = [...SENSITIVITY_ADOPTION_STEPS];
  let efficiencySteps: number[] = [...SENSITIVITY_EFFICIENCY_STEPS];

  const build = () =>
    efficiencySteps.map((efficiencyGain) =>
      adoptionSteps.map((adoptionRate) => {
        const r = computeScenario(profile, scope, { ...params, adoptionRate, efficiencyGain });
        return { adoptionRate, efficiencyGain, roi3yPct: r.roi3yPct, netValue3y: r.netValue3y, paybackMonth: r.paybackMonth };
      }),
    );

  let rows = build();
  let guard = 0;
  while (!rows.some((row) => row.some((c) => c.netValue3y < 0)) && guard < 3) {
    adoptionSteps = [Math.max(1, Math.round(adoptionSteps[0] / 2)), ...adoptionSteps];
    efficiencySteps = [Math.max(1, Math.round(efficiencySteps[0] / 2)), ...efficiencySteps];
    rows = build();
    guard++;
  }
  return { adoptionSteps, efficiencySteps, rows };
}

export function formatIls(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('he-IL');
  return amount < 0 ? `-₪${formatted}` : `₪${formatted}`;
}

export function formatCompactIls(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${sign}₪${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}₪${Math.round(abs / 1_000)}K`;
  return `${sign}₪${Math.round(abs)}`;
}

export function formatPct(v: number, digits = 0): string {
  return `${v.toFixed(digits)}%`;
}
