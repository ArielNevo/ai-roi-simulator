import { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, BookmarkPlus, Info, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCompactIls, formatIls, sensitivityMatrix, simulate, MONTHLY_HOURS_PER_FTE } from '../finance/model';
import type { SimulationParams } from '../types/strategy';
import { Button, Card, SectionTitle, SourceTag, Stat } from './ui';
import { ComparisonView } from './ComparisonView';

interface SliderDef { key: keyof SimulationParams; label: string; min: number; max: number; step: number; fmt: (v: number) => string; hint: string }

const SLIDERS: SliderDef[] = [
  { key: 'adoptionRate', label: 'שיעור אימוץ בפועל', min: 0, max: 100, step: 5, fmt: (v) => `${v}%`, hint: 'אחוז העובדים המושפעים שישתמשו בכלי באופן קבוע' },
  { key: 'efficiencyGain', label: 'חיסכון בזמן לתהליך', min: 0, max: 75, step: 5, fmt: (v) => `${v}%`, hint: 'כמה מהזמן בתהליך המטופל נחסך למשתמש שמאמץ' },
  { key: 'hitlOverhead', label: 'תקורת בקרה אנושית (HITL)', min: 0, max: 50, step: 5, fmt: (v) => `${v}%`, hint: 'זמן בדיקה ותיקון של פלט המודל, מקוזז מהחיסכון' },
  { key: 'realizationRate', label: 'שיעור מימוש לכסף', min: 0, max: 100, step: 5, fmt: (v) => `${v}%`, hint: 'איזה חלק מהשעות שמתפנות הופך לכסף אמיתי (תקנים, ספקים, שעות חיוב)' },
  { key: 'monthlyLicensePerUserIls', label: 'רישוי חודשי למשתמש', min: 0, max: 1500, step: 10, fmt: (v) => formatIls(v), hint: 'SaaS, API או חישוב, לכל משתמש פעיל' },
  { key: 'oneTimeImplementationCostIls', label: 'עלות הקמה חד-פעמית', min: 0, max: 3_000_000, step: 10_000, fmt: (v) => formatCompactIls(v), hint: 'אינטגרציה, אבטחה, ניהול פרויקט' },
  { key: 'trainingCostPerUserIls', label: 'הדרכה וניהול שינוי למשתמש', min: 0, max: 5000, step: 100, fmt: (v) => formatIls(v), hint: 'חד-פעמי, לכל משתמש פעיל' },
  { key: 'annualMaintenancePct', label: 'תחזוקה שנתית (% מההקמה)', min: 0, max: 40, step: 1, fmt: (v) => `${v}%`, hint: '0 ל-SaaS טהור, 15–20 לפיתוח' },
  { key: 'rampMonths', label: 'עקומת אימוץ (חודשים ל-100%)', min: 1, max: 24, step: 1, fmt: (v) => `${v} חודשים`, hint: 'S-curve: כמה זמן עד שהארגון משתמש במלוא הפוטנציאל' },
  { key: 'discountRatePct', label: 'שיעור היוון (NPV)', min: 0, max: 20, step: 1, fmt: (v) => `${v}%`, hint: 'עלות ההון של הארגון' },
];

function cellTone(net: number, roi: number): string {
  if (net < 0) return 'bg-rose-100 text-rose-900';
  if (roi < 50) return 'bg-amber-50 text-amber-900';
  if (roi < 150) return 'bg-emerald-50 text-emerald-800';
  return 'bg-emerald-200 text-emerald-900';
}

export function Stage3Simulator() {
  const { analysis, profile, selectedScopeId, selectScope, params, paramSources, setParam, resetParams, saveScenario, setStage } = useAppStore();
  const [scenarioName, setScenarioName] = useState('');
  const initiatives = analysis?.initiatives ?? [];

  const sim = useMemo(() => simulate(profile, initiatives, selectedScopeId, params), [profile, initiatives, selectedScopeId, params]);
  const matrix = useMemo(() => sensitivityMatrix(profile, initiatives, selectedScopeId, params), [profile, initiatives, selectedScopeId, params]);
  if (!analysis) return null;

  const b = sim.base;
  const scopeLabel = selectedScopeId === 'PORTFOLIO' ? `כלל הפורטפוליו (${initiatives.length} יוזמות)` : initiatives.find((i) => i.id === selectedScopeId)?.title ?? '';
  const chartData = b.series.map((p, idx) => ({ month: `M${p.month}`, base: Math.round(p.cumulative), opt: Math.round(sim.optimistic.series[idx].cumulative), pess: Math.round(sim.pessimistic.series[idx].cumulative) }));
  const fteFreed = (b.monthlyHoursSavedSteady / MONTHLY_HOURS_PER_FTE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">שלב 3 · סימולטור ROI וניתוח רגישות</div>
          <h2 className="mt-1 text-2xl font-extrabold">מודל החזר השקעה ל-36 חודשים</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedScopeId} onChange={(e) => selectScope(e.target.value)}>
            <option value="PORTFOLIO">כלל הפורטפוליו ({initiatives.length} יוזמות)</option>
            {initiatives.map((i, idx) => <option key={i.id} value={i.id}>#{idx + 1} {i.title}</option>)}
          </select>
          <Button onClick={() => setStage(4)}>המשך למדדים ותוכנית <ArrowLeft className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="ROI ל-3 שנים (ערך ממומש)" value={`${b.roi3yPct >= 0 ? '+' : ''}${b.roi3yPct.toFixed(0)}%`} sub={`ממוצע שנתי ${b.annualizedRoiPct.toFixed(0)}%`} tone={b.roi3yPct >= 0 ? 'emerald' : 'rose'} />
        <Stat label="ערך כספי נטו ל-3 שנים" value={formatCompactIls(b.netValue3y)} sub={`NPV בהיוון ${params.discountRatePct}%: ${formatCompactIls(b.npv3y)}`} tone={b.netValue3y >= 0 ? 'emerald' : 'rose'} />
        <Stat label="נקודת איזון" value={b.paybackMonth ? `חודש ${b.paybackMonth}` : 'מעבר ל-36'} sub={b.paybackMonth ? `פסימי: ${sim.pessimistic.paybackMonth ? 'חודש ' + sim.pessimistic.paybackMonth : '> 36'}` : 'ההשקעה לא מוחזרת באופק'} tone={b.paybackMonth ? 'blue' : 'rose'} />
        <Stat label="שעות שמתפנות בשנה (יציב)" value={Math.round(b.monthlyHoursSavedSteady * 12).toLocaleString('he-IL')} sub={`≈ ${fteFreed.toFixed(1)} תקנים · ${b.activeUsers} משתמשים פעילים מתוך ${b.affectedEmployees}`} />
        <Stat label="עלות כוללת ל-3 שנים (TCO)" value={formatCompactIls(b.totalCost3y)} sub={`הקמה והדרכה ${formatCompactIls(b.oneTimeCost)} · רישוי ${formatCompactIls(b.monthlyLicenseCostSteady)}/חודש`} />
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <b>ערך רך מול ערך ממומש.</b> המודל מחשב קודם שעות שמתפנות ({formatCompactIls(b.totalSoftValue3y)} ב-3 שנים במונחי עלות שכר), ורק <b>{params.realizationRate}%</b> מהן נספרות ככסף ({formatCompactIls(b.totalHardValue3y)}). שעה שמתפנה הופכת לכסף רק אם היא מתורגמת לתקן שלא מגויס, לספק שמוחלף, לשעת חיוב או ל-SLA שעומדים בו. זה ההבדל בין מצגת ROI לבין תקציב.
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <SectionTitle title="משתני בקרה והנחות" sub={scopeLabel} action={<Button variant="ghost" onClick={resetParams}><RotateCcw className="h-4 w-4" /> אפס</Button>} />
          <div className="space-y-4">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{s.label}</span>
                  <span className="flex items-center gap-2"><SourceTag source={paramSources[s.key]} /><b className="num text-blue-700">{s.fmt(params[s.key])}</b></span>
                </div>
                <input type="range" aria-label={s.label} min={s.min} max={s.max} step={s.step} value={params[s.key]} onChange={(e) => setParam(s.key, Number(e.target.value))} className="mt-1 w-full" />
                <div className="text-xs text-slate-500">{s.hint}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <input className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="שם לתרחיש, למשל: רישיונות לכולם" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
            <Button variant="secondary" disabled={!scenarioName.trim()} onClick={() => { saveScenario(scenarioName.trim()); setScenarioName(''); }}><BookmarkPlus className="h-4 w-4" /> שמור להשוואה</Button>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <SectionTitle title="תזרים מצטבר ל-36 חודשים" sub="שלושה תרחישים: פסימי, בסיס (לפי המחוונים) ואופטימי. ערך ממומש בלבד, לאחר רישוי ותחזוקה." />
            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-rose-50 p-2"><div className="text-slate-500">פסימי</div><div className="num font-bold text-rose-700" dir="ltr">{formatCompactIls(sim.pessimistic.netValue3y)}</div></div>
              <div className="rounded-lg bg-blue-50 p-2"><div className="text-slate-500">בסיס</div><div className="num font-bold text-blue-700" dir="ltr">{formatCompactIls(b.netValue3y)}</div></div>
              <div className="rounded-lg bg-emerald-50 p-2"><div className="text-slate-500">אופטימי</div><div className="num font-bold text-emerald-700" dir="ltr">{formatCompactIls(sim.optimistic.netValue3y)}</div></div>
            </div>
            <div dir="ltr" className="h-72 w-full">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={5} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactIls(Number(v))} width={70} />
                  <ReferenceLine y={0} stroke="#64748b" />
                  <Tooltip formatter={(v) => formatIls(Number(v))} labelFormatter={(l) => `חודש ${String(l).replace('M', '')}`} contentStyle={{ direction: 'rtl', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="base" name="בסיס" stroke="#1d4ed8" fill="#bfdbfe" fillOpacity={0.5} />
                  <Line type="monotone" dataKey="opt" name="אופטימי" stroke="#059669" strokeDasharray="5 4" dot={false} />
                  <Line type="monotone" dataKey="pess" name="פסימי" stroke="#e11d48" strokeDasharray="5 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle title="מטריצת רגישות: אימוץ מול התייעלות" sub="ROI ל-3 שנים וערך נטו. אדום = הפסד. שים לב: יותר אימוץ בלי התייעלות מגדיל הפסד, כי רישוי והדרכה גדלים עם המשתמשים." />
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr><th className="p-2 text-start text-slate-500">התייעלות ↓ / אימוץ →</th>{matrix.adoptionSteps.map((a) => <th key={a} className="num p-2 text-slate-600">{a}%</th>)}</tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row, r) => (
                    <tr key={r}>
                      <td className="num p-2 text-start font-semibold text-slate-700">{matrix.efficiencySteps[r]}%</td>
                      {row.map((c) => {
                        const current = c.adoptionRate === params.adoptionRate && c.efficiencyGain === params.efficiencyGain;
                        return (
                          <td key={c.adoptionRate} className={`num p-2 ${cellTone(c.netValue3y, c.roi3yPct)} ${current ? 'ring-2 ring-inset ring-slate-900' : ''}`}>
                            <div className="font-bold">{c.roi3yPct >= 0 ? '+' : ''}{c.roi3yPct.toFixed(0)}%</div>
                            <div className="text-[10px] opacity-80">{formatCompactIls(c.netValue3y)}{c.paybackMonth ? ` · M${c.paybackMonth}` : ''}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="שקיפות: הנוסחאות שמאחורי המספרים" sub="כל החישוב רץ בדפדפן, בקובץ src/finance/model.ts, עם בדיקות יחידה. המודל אינו קורא לבינה מלאכותית." />
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="font-semibold">שעות שמתפנות בחודש (במצב יציב)</div>
            <div className="num mt-1 text-xs text-slate-600" dir="ltr">{b.affectedEmployees} עובדים × {MONTHLY_HOURS_PER_FTE} ש׳ × {Math.round(sim.scope.processTimeShare * 100)}% נתח תהליך × {params.adoptionRate}% אימוץ × {params.efficiencyGain}% התייעלות × (1 − {params.hitlOverhead}% HITL) = {Math.round(b.monthlyHoursSavedSteady).toLocaleString('he-IL')}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="font-semibold">ערך ממומש בחודש</div>
            <div className="num mt-1 text-xs text-slate-600" dir="ltr">{Math.round(b.monthlyHoursSavedSteady).toLocaleString('he-IL')} ש׳ × ₪{profile.avgHourlyCostIls} × {params.realizationRate}% מימוש = {formatIls(b.monthlyHardValueSteady)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="font-semibold">עלויות</div>
            <div className="mt-1 text-xs text-slate-600">חודש 0: הקמה {formatIls(params.oneTimeImplementationCostIls)} + הדרכה {formatIls(b.trainingCost)} ({b.activeUsers} × {formatIls(params.trainingCostPerUserIls)}). כל חודש: רישוי {formatIls(b.monthlyLicenseCostSteady)} (לפחות 50% מהמושבים משולמים מחודש 1) + תחזוקה {formatIls(b.monthlyMaintenanceCost)}.</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="font-semibold">עקומת אימוץ ו-ROI</div>
            <div className="mt-1 text-xs text-slate-600">S-curve (smoothstep) שמגיעה ל-100% אחרי {params.rampMonths} חודשים. ROI ל-3 שנים = (ערך ממומש − עלות כוללת) ÷ עלות כוללת. NPV מהוון חודשית ב-{params.discountRatePct}% שנתי. תרחיש אופטימי/פסימי: ±15–20 נק׳ אימוץ, ±10 נק׳ התייעלות, ±15 נק׳ מימוש, ±10–25% בעלות הקמה, ועקומת אימוץ מהירה/איטית ב-25–50%.</div>
          </div>
        </div>
      </Card>

      <ComparisonView />
    </div>
  );
}
