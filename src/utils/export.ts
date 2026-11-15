import type { OrganizationProfile, SimulationParams, StrategyAnalysisResult } from '../types/strategy';
import { BUY_BUILD_LABELS } from '../types/strategy';
import { formatIls, type SimulationResult } from '../finance/model';

export function download(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob(['﻿' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildMarkdown(profile: OrganizationProfile, analysis: StrategyAnalysisResult, sim: SimulationResult | null, params: SimulationParams | null, scopeLabel: string): string {
  const lines: string[] = [];
  lines.push(`# דוח הנהלה: אסטרטגיית AI ו-ROI — ${profile.orgName}`);
  lines.push('');
  lines.push(`תאריך: ${new Date().toLocaleDateString('he-IL')} · מקור הניתוח: ${analysis.origin === 'llm' ? 'ניתוח AI' : analysis.origin === 'fallback' ? 'תרחיש חלופי (הספק נכשל)' : 'תרחיש לדוגמה'}`);
  if (analysis.providerNote) lines.push(`> ${analysis.providerNote}`);
  lines.push('');
  lines.push('## תמצית מנהלים');
  lines.push(analysis.executiveSummary);
  lines.push('');
  lines.push('## פרופיל הארגון');
  lines.push(`- מגזר: ${profile.sector}`);
  lines.push(`- עובדים רלוונטיים: ${profile.relevantEmployees} · עלות שעה: ${formatIls(profile.avgHourlyCostIls)}`);
  lines.push(`- רגישות מידע: ${profile.sensitivity} · מגבלת ענן: ${profile.cloudConstraint} · בשלות דאטה: ${profile.dataMaturity}/5`);
  lines.push('');
  lines.push('## יוזמות והמלצת קנייה מול פיתוח');
  lines.push('| # | יוזמה | המלצה | מאמץ | אימפקט | שבועות | תלות בדאטה |');
  lines.push('|---|---|---|---|---|---|---|');
  analysis.initiatives.forEach((i, idx) => lines.push(`| ${idx + 1} | ${i.title} | ${BUY_BUILD_LABELS[i.strategicRecommendation]} | ${i.effortScore}/10 | ${i.impactScore}/10 | ${i.estimatedWeeks} | ${i.dataDependency} |`));
  lines.push('');
  for (const i of analysis.initiatives) {
    lines.push(`### ${i.title}`);
    lines.push(i.problemAndSolution);
    lines.push(`**נימוק:** ${i.recommendationRationale}`);
    lines.push(`**כלים:** ${i.recommendedTools.map((t) => `${t.category}: ${t.tools.join(', ')} (${t.deployment})`).join(' · ')}`);
    lines.push(`**סיכונים:** ${i.risks.map((r) => `${r.area}: ${r.risk} → ${r.mitigation}`).join(' · ')}`);
    lines.push('');
  }
  if (sim && params) {
    const b = sim.base;
    lines.push(`## סימולציית ROI: ${scopeLabel}`);
    lines.push('| מדד | תרחיש פסימי | תרחיש בסיס | תרחיש אופטימי |');
    lines.push('|---|---|---|---|');
    lines.push(`| ערך כספי נטו ל-3 שנים | ${formatIls(sim.pessimistic.netValue3y)} | ${formatIls(b.netValue3y)} | ${formatIls(sim.optimistic.netValue3y)} |`);
    lines.push(`| NPV (היוון ${params.discountRatePct}%) | ${formatIls(sim.pessimistic.npv3y)} | ${formatIls(b.npv3y)} | ${formatIls(sim.optimistic.npv3y)} |`);
    lines.push(`| ROI ל-3 שנים | ${sim.pessimistic.roi3yPct.toFixed(0)}% | ${b.roi3yPct.toFixed(0)}% | ${sim.optimistic.roi3yPct.toFixed(0)}% |`);
    lines.push(`| נקודת איזון (חודש) | ${sim.pessimistic.paybackMonth ?? '> 36'} | ${b.paybackMonth ?? '> 36'} | ${sim.optimistic.paybackMonth ?? '> 36'} |`);
    lines.push('');
    lines.push('### הנחות');
    lines.push(`- אימוץ ${params.adoptionRate}% · התייעלות ${params.efficiencyGain}% · תקורת בקרה אנושית ${params.hitlOverhead}% · שיעור מימוש ${params.realizationRate}%`);
    lines.push(`- רישוי ${formatIls(params.monthlyLicensePerUserIls)}/משתמש/חודש · הקמה ${formatIls(params.oneTimeImplementationCostIls)} · הדרכה ${formatIls(params.trainingCostPerUserIls)}/משתמש · תחזוקה ${params.annualMaintenancePct}%/שנה · עקומת אימוץ ${params.rampMonths} חודשים`);
    lines.push(`- שעות שמתפנות בשנה (יציב): ${Math.round(b.monthlyHoursSavedSteady * 12).toLocaleString('he-IL')} · ערך רך ל-3 שנים ${formatIls(b.totalSoftValue3y)} · ערך ממומש ${formatIls(b.totalHardValue3y)}`);
    lines.push('');
  }
  lines.push('## מדדי הצלחה (KPI / OKR)');
  lines.push('| קטגוריה | מדד | רבעון 1 | רבעון 2 | שנה 1 | אחראי |');
  lines.push('|---|---|---|---|---|---|');
  analysis.kpis.forEach((k) => lines.push(`| ${k.category} | ${k.metricName} | ${k.q1Target} | ${k.q2Target} | ${k.year1Target} | ${k.owner} |`));
  lines.push('');
  lines.push('## צ\'קליסט ממשל, אבטחה והכשרה');
  analysis.governanceChecklist.forEach((g) => lines.push(`- [${g.completed ? 'x' : ' '}] (${g.priority}) ${g.title} — ${g.description}`));
  if (analysis.sources.length) {
    lines.push('');
    lines.push('## מקורות');
    analysis.sources.forEach((s) => lines.push(`- [${s.title}](${s.uri})`));
  }
  return lines.join('\n');
}

export function buildCsv(analysis: StrategyAnalysisResult, sim: SimulationResult | null): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push(['יוזמה', 'המלצה', 'מאמץ', 'אימפקט', 'שבועות', 'אימוץ %', 'התייעלות %', 'HITL %', 'מימוש %', 'רישוי/משתמש/חודש', 'הקמה'].map(esc).join(','));
  for (const i of analysis.initiatives) {
    const f = i.financialDefaults;
    rows.push([i.title, BUY_BUILD_LABELS[i.strategicRecommendation], i.effortScore, i.impactScore, i.estimatedWeeks, f.adoptionRate, f.efficiencyGain, f.hitlOverhead, f.realizationRate, f.monthlyLicensePerUserIls, f.oneTimeImplementationCostIls].map(esc).join(','));
  }
  if (sim) {
    rows.push('');
    rows.push(['חודש', 'מצטבר בסיס', 'מצטבר אופטימי', 'מצטבר פסימי', 'שעות שנחסכו (בסיס)', 'ערך ממומש (בסיס)', 'עלות רישוי', 'תחזוקה'].map(esc).join(','));
    sim.base.series.forEach((p, idx) => rows.push([p.month, Math.round(p.cumulative), Math.round(sim.optimistic.series[idx].cumulative), Math.round(sim.pessimistic.series[idx].cumulative), Math.round(p.hoursSaved), Math.round(p.hardValue), Math.round(p.licenseCost), Math.round(p.maintenanceCost)].join(',')));
  }
  return rows.join('\n');
}
