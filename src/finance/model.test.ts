import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMS,
  HORIZON_MONTHS,
  computeScenario,
  getScope,
  rampFactor,
  sensitivityMatrix,
  simulate,
} from './model';
import type { Initiative, SimulationParams } from '../types/strategy';

const profile = { relevantEmployees: 300, avgHourlyCostIls: 200 };
const scope = { affectedShare: 0.5, processTimeShare: 0.25 };

function initiative(overrides: Partial<Initiative['financialDefaults']> = {}, id = 'a'): Initiative {
  return {
    id,
    title: 'בדיקה',
    problemAndSolution: '',
    strategicRecommendation: 'buy',
    recommendationRationale: '',
    dataDependency: 'low',
    effortScore: 3,
    impactScore: 7,
    estimatedWeeks: 8,
    recommendedTools: [{ category: 'c', tools: ['t'], deployment: 'SaaS', privacyFitNote: '' }],
    risks: [{ area: 'a', risk: 'r', mitigation: 'm' }],
    financialDefaults: {
      affectedEmployeesShare: 0.5,
      processTimeShare: 0.25,
      adoptionRate: 60,
      efficiencyGain: 25,
      hitlOverhead: 15,
      realizationRate: 40,
      monthlyLicensePerUserIls: 110,
      oneTimeImplementationCostIls: 150_000,
      trainingCostPerUserIls: 1200,
      annualMaintenancePct: 10,
      ...overrides,
    },
  };
}

describe('rampFactor', () => {
  it('starts at 0, reaches 1 at rampMonths, and is monotonic', () => {
    expect(rampFactor(0, 12)).toBe(0);
    expect(rampFactor(12, 12)).toBe(1);
    expect(rampFactor(24, 12)).toBe(1);
    let prev = 0;
    for (let m = 1; m <= 12; m++) {
      const r = rampFactor(m, 12);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
    expect(rampFactor(6, 12)).toBeCloseTo(0.5, 5);
  });
});

describe('computeScenario', () => {
  it('saves nothing when adoption is zero, but still pays the one-time cost', () => {
    const r = computeScenario(profile, scope, { ...DEFAULT_PARAMS, adoptionRate: 0 });
    expect(r.totalHoursSaved3y).toBe(0);
    expect(r.totalHardValue3y).toBe(0);
    expect(r.netValue3y).toBeLessThan(0);
    expect(r.paybackMonth).toBeNull();
  });

  it('realization rate halves money but not hours', () => {
    const full = computeScenario(profile, scope, { ...DEFAULT_PARAMS, realizationRate: 100 });
    const half = computeScenario(profile, scope, { ...DEFAULT_PARAMS, realizationRate: 50 });
    expect(half.totalHoursSaved3y).toBeCloseTo(full.totalHoursSaved3y, 6);
    expect(half.totalSoftValue3y).toBeCloseTo(full.totalSoftValue3y, 6);
    expect(half.totalHardValue3y).toBeCloseTo(full.totalHardValue3y / 2, 6);
  });

  it('cannot pay back before month 4 when there is a real one-time cost and a 12-month ramp', () => {
    const r = computeScenario(profile, scope, {
      ...DEFAULT_PARAMS,
      adoptionRate: 100,
      efficiencyGain: 75,
      hitlOverhead: 0,
      realizationRate: 100,
      oneTimeImplementationCostIls: 400_000,
    });
    expect(r.paybackMonth).not.toBeNull();
    expect(r.paybackMonth!).toBeGreaterThanOrEqual(4);
  });

  it('series has 37 points (month 0..36) and cumulative is consistent with net', () => {
    const r = computeScenario(profile, scope, DEFAULT_PARAMS);
    expect(r.series).toHaveLength(HORIZON_MONTHS + 1);
    const sum = r.series.reduce((a, p) => a + p.net, 0);
    expect(r.series[HORIZON_MONTHS].cumulative).toBeCloseTo(sum, 3);
  });

  it('NPV is below undiscounted net value when the discount rate is positive and the plan is profitable', () => {
    const r = computeScenario(profile, scope, { ...DEFAULT_PARAMS, discountRatePct: 10, realizationRate: 100 });
    expect(r.netValue3y).toBeGreaterThan(0);
    expect(r.npv3y).toBeLessThan(r.netValue3y);
    const r0 = computeScenario(profile, scope, { ...DEFAULT_PARAMS, discountRatePct: 0, realizationRate: 100 });
    expect(r0.npv3y).toBeCloseTo(r0.netValue3y, 3);
  });

  it('maintenance and training are real costs', () => {
    const base = computeScenario(profile, scope, { ...DEFAULT_PARAMS, annualMaintenancePct: 0, trainingCostPerUserIls: 0 });
    const withCosts = computeScenario(profile, scope, { ...DEFAULT_PARAMS, annualMaintenancePct: 20, trainingCostPerUserIls: 2000 });
    expect(withCosts.totalCost3y).toBeGreaterThan(base.totalCost3y);
    expect(withCosts.trainingCost).toBe(withCosts.activeUsers * 2000);
    expect(withCosts.monthlyMaintenanceCost).toBeCloseTo((DEFAULT_PARAMS.oneTimeImplementationCostIls * 0.2) / 12, 6);
  });

  it('ROI definitions are consistent', () => {
    const r = computeScenario(profile, scope, DEFAULT_PARAMS);
    expect(r.roi3yPct).toBeCloseTo((r.netValue3y / r.totalCost3y) * 100, 6);
    expect(r.annualizedRoiPct).toBeCloseTo(r.roi3yPct / 3, 6);
  });
});

describe('simulate', () => {
  it('optimistic ≥ base ≥ pessimistic on net value', () => {
    const s = simulate(profile, [initiative()], 'a', DEFAULT_PARAMS);
    expect(s.optimistic.netValue3y).toBeGreaterThanOrEqual(s.base.netValue3y);
    expect(s.base.netValue3y).toBeGreaterThanOrEqual(s.pessimistic.netValue3y);
  });

  it('portfolio exposure is capped at 45% of hours', () => {
    const many = Array.from({ length: 8 }, (_, i) => initiative({ affectedEmployeesShare: 1, processTimeShare: 0.5 }, `i${i}`));
    expect(getScope(many, 'PORTFOLIO').processTimeShare).toBe(0.45);
  });
});

describe('sensitivityMatrix', () => {
  it('always contains at least one losing cell', () => {
    const generous: SimulationParams = { ...DEFAULT_PARAMS, realizationRate: 100, hitlOverhead: 0, oneTimeImplementationCostIls: 10_000, monthlyLicensePerUserIls: 0, trainingCostPerUserIls: 0 };
    const m = sensitivityMatrix(profile, [initiative()], 'a', generous);
    expect(m.rows.flat().some((c) => c.netValue3y < 0)).toBe(true);
  });

  it('more efficiency never reduces net value', () => {
    const m = sensitivityMatrix(profile, [initiative()], 'a', DEFAULT_PARAMS);
    for (let r = 1; r < m.rows.length; r++) {
      for (let c = 0; c < m.rows[r].length; c++) expect(m.rows[r][c].netValue3y).toBeGreaterThanOrEqual(m.rows[r - 1][c].netValue3y - 1e-6);
    }
  });

  it('more adoption can LOSE money when efficiency is low (licences and training scale with users)', () => {
    // This is deliberate: rolling a tool out to everyone before it works is the
    // most common way AI programmes burn budget. The matrix must show it.
    const m = sensitivityMatrix(profile, [initiative()], 'a', { ...DEFAULT_PARAMS, efficiencyGain: 5 });
    const lowEffRow = m.rows[0];
    expect(lowEffRow[lowEffRow.length - 1].netValue3y).toBeLessThan(lowEffRow[0].netValue3y);
  });
});
