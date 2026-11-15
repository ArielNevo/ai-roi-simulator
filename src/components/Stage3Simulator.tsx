import { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, BookmarkPlus, Info, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCompactIls, formatIls, sensitivityMatrix, simulate, MONTHLY_HOURS_PER_FTE } from '../finance/model';
import type { SimulationParams } from '../types/strategy';
import { Button, Card, Note, SectionTitle, Slider, StageHeader, Stat, inputCls } from './ui';
import { ComparisonView } from './ComparisonView';

interface SliderDef { key: keyof SimulationParams; label: string; min: number; max: number; step: number; fmt: (v: number) => string; hint: string; group: 'value' | 'cost' | 'time' }

const SLIDERS: SliderDef[] = [
  { key: 'adoptionRate', label: 'שיעור אימוץ בפועל', min: 0, max: 100, step: 5, fmt: (v) => `${v}%`, hint: 'אחוז העובדים המושפעים שישתמשו בכלי באופן קבוע', group: 'value' },
  { key: 'efficiencyGain', label: 'חיסכון בזמן לתהליך', min: 0, max: 75, step: 5, fmt: (v) => `${v}%`, hint: 'כמה מהזמן בתהליך המטופל נחסך למשתמש שמאמץ', group: 'value' },
  { key: 'hitlOverhead', label: 'תקורת בקרה אנושית (HITL)', min: 0, max: 50, step: 5, fmt: (v) => `${v}%`, hint: 'זמן בדיקה ותיקון של פלט המודל, מקוזז מהחיסכון', group: 'value' },
  { key: 'realizationRate', label: 'שיעור מימוש לכסף', min: 0, max: 100, step: 5, fmt: (v) => `${v}%`, hint: 'איזה חלק מהשעות שמתפנות הופך לכסף אמיתי (תקנים, ספקים, שעות חיוב)', group: 'value' },
  { key: 'monthlyLicensePerUserIls', label: 'רישוי חודשי למשתמש', min: 0, max: 1500, step: 10, fmt: (v) => formatIls(v), hint: 'SaaS, API או חישוב, לכל משתמש פעיל', group: 'cost' },
  { key: 'oneTimeImplementationCostIls', label: 'עלות הקמה חד-פעמית', min: 0, max: 3_000_000, step: 10_000, fmt: (v) => formatCompactIls(v), hint: 'אינטגרציה, אבטחה, ניהול פרויקט', group: 'cost' },
  { key: 'trainingCostPerUserIls', label: 'הדרכה וניהול שינוי למשתמש', min: 0, max: 5000, step: 100, fmt: (v) => formatIls(v), hint: 'חד-פעמי, לכל משתמש פעיל', group: 'cost' },
  { key: 'annualMaintenancePct', label: 'תחזוקה שנתית (% מההקמה)', min: 0, max: 40, step: 1, fmt: (v) => `${v}%`, hint: '0 ל-SaaS טהור, 15–20 לפיתוח', group: 'cost' },
  { key: 'rampMonths', label: 'עקומת אימוץ (חודשים ל-100%)', min: 1, max: 24, step: 1, fmt: (v) => `${v} חודשים`, hint: 'S-curve: כמה זמן עד שהארגון משתמש במלוא הפוטנציאל', group: 'time' },
  { key: 'discountRatePct', label: 'שיעור היוון (NPV)', min: 0, max: 20, step: 1, fmt: (v) => `${v}%`, hint: 'עלות ההון של הארגון', group: 'time' },
];
const GROUPS: { id: SliderDef['group']; label: string }[] = [{ id: 'value', label: 'ערך' }, { id: 'cost', label: 'עלויות' }, { id: 'time', label: 'זמן והיוון' }];

function cellTone(net: number, roi: number): string {
  if (net < 0) return 'bg-down/15 text-[#8b1a35]';
  if (roi < 50) return 'bg-warn-soft text-[#7a4a02]';
  if (roi < 150) return 'bg-up-soft text-up';
  return 'bg-up/30 text-[#065f46]';
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
  const chartData = b.series.map((p, idx) => ({ month: p.month, base: Math.round(p.cumulative), opt: Math.round(sim.optimistic.series[idx].cumulative), pess: Math.round(sim.pessimistic.series[idx].cumulative) }));
  const fteFreed = (b.monthlyHoursSavedSteady / MONTHLY_HOURS_PER_FTE);
  const cumulative = b.series.map((p) => p.cumulative);

  return (
    <div className="space-y-7">
      <StageHeader
        eyebrow="שלב 3 · סימולטור ROI וניתוח רגישות"
        title="מודל החזר השקעה ל-36 חודשים"
        sub="כל מחוון מחשב מחדש את התזרים, ה-NPV ומטריצת הרגישות. ערך רך הופך לכסף רק דרך שיעור המימוש."
        actions={<>
          <select className={`${inputCls} w-auto min-w-56`} value={selectedScopeId} onChange={(e) => selectScope(e.target.value)} aria-label="היקף הסימולציה">
            <option value="PORTFOLIO">כלל הפורטפוליו ({initiatives.length} יוזמות)</option>
            {initiatives.map((i, idx) => <option key={i.id} value={i.id}>#{idx + 1} {i.title}</option>)}
          </select>
          <Button onClick={() => setStage(4)}>המשך למדדים ותוכנית <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></Button>
        </>}
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat style={{ '--i': 0 } as React.CSSProperties} label="ROI ל-3 שנים (ערך ממומש)" value={b.roi3yPct} format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} sub={`ממוצע שנתי ${b.annualizedRoiPct.toFixed(0)}%`} tone={b.roi3yPct >= 0 ? 'emerald' : 'rose'} spark={cumulative} />
        <Stat style={{ '--i': 1 } as React.CSSProperties} label="ערך כספי נטו ל-3 שנים" value={b.netValue3y} format={formatCompactIls} sub={`NPV בהיוון ${params.discountRatePct}%: ${formatCompactIls(b.npv3y)}`} tone={b.netValue3y >= 0 ? 'emerald' : 'rose'} />
        <Stat style={{ '--i': 2 } as React.CSSProperties} label="נקודת איזון" value={b.paybackMonth ? `חודש ${b.paybackMonth}` : 'מעבר ל-36'} sub={b.paybackMonth ? `פסימי: ${sim.pessimistic.paybackMonth ? 'חודש ' + sim.pessimistic.paybackMonth : '> 36'}` : 'ההשקעה לא מוחזרת באופק'} tone={b.paybackMonth ? 'blue' : 'rose'} />
        <Stat style={{ '--i': 3 } as React.CSSProperties} label="שעות שמתפנות בשנה (יציב)" value={b.monthlyHoursSavedSteady * 12} sub={`≈ ${fteFreed.toFixed(1)} תקנים · ${b.activeUsers} משתמשים פעילים מתוך ${b.affectedEmployees}`} />
        <Stat style={{ '--i': 4 } as React.CSSProperties} label="עלות כוללת ל-3 שנים (TCO)" value={b.totalCost3y} format={formatCompactIls} sub={`הקמה והדרכה ${formatCompactIls(b.oneTimeCost)} · רישוי ${formatCompactIls(b.monthlyLicenseCostSteady)}/חודש`} />
      </div>

      <Note icon={<Info className="h-4 w-4" />}>
        <b>ערך רך מול ערך ממומש.</b> המודל מחשב קודם שעות שמתפנות (<span className="num">{formatCompactIls(b.totalSoftValue3y)}</span> ב-3 שנים במונחי עלות שכר), ורק <b className="num">{params.realizationRate}%</b> מהן נספרות ככסף (<span className="num">{formatCompactIls(b.totalHardValue3y)}</span>). שעה שמתפנה הופכת לכסף רק אם היא מתורגמת לתקן שלא מגויס, לספק שמוחלף, לשעת חיוב או ל-SLA שעומדים בו. זה ההבדל בין מצגת ROI לבין תקציב.
      </Note>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <SectionTitle title="משתני בקרה והנחות" sub={scopeLabel} action={<Button variant="ghost" size="sm" onClick={resetParams}><RotateCcw className="h-3.5 w-3.5" /> אפס</Button>} />
          <div className="space-y-6">
            {GROUPS.map((g) => (
              <div key={g.id}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute"><span className="h-px flex-1 bg-line" />{g.label}<span className="h-px flex-1 bg-line" /></div>
                <div className="space-y-3.5">
                  {SLIDERS.filter((s) => s.group === g.id).map((s) => (
                    <Slider key={s.key} label={s.label} hint={s.hint} min={s.min} max={s.max} step={s.step} fmt={s.fmt} value={params[s.key]} source={paramSources[s.key]} onChange={(v) => setParam(s.key, v)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2 border-t border-line pt-5">
            <input className={`${inputCls} min-w-0 flex-1`} placeholder="שם לתרחיש, למשל: רישיונות לכולם" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
            <Button variant="secondary" className="shrink-0" disabled={!scenarioName.trim()} onClick={() => { saveScenario(scenarioName.trim()); setScenarioName(''); }}><BookmarkPlus className="h-4 w-4" /> שמור</Button>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <SectionTitle title="תזרים מצטבר ל-36 חודשים" sub="פסימי, בסיס (לפי המחוונים) ואופטימי. ערך ממומש בלבד, לאחר רישוי ותחזוקה." />
            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { l: 'פסימי', v: sim.pessimistic.netValue3y, c: 'text-down', bg: 'bg-down-soft' },
                { l: 'בסיס', v: b.netValue3y, c: 'text-signal-2', bg: 'bg-signal-soft' },
                { l: 'אופטימי', v: sim.optimistic.netValue3y, c: 'text-up', bg: 'bg-up-soft' },
              ].map((x) => (
                <div key={x.l} className={`rounded-2xl p-2.5 ${x.bg}`}><div className="text-mute">{x.l}</div><div className={`num text-base font-semibold ${x.c}`} dir="ltr">{formatCompactIls(x.v)}</div></div>
              ))}
            </div>
            <div dir="ltr" className="h-72 w-full">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="baseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2b3cff" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2b3cff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e4ddcc" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6f7580' }} tickLine={false} axisLine={{ stroke: '#ddd6c6' }} interval={5} tickFormatter={(v) => `M${v}`} />
                  <YAxis tick={{ fontSize: 11, fill: '#6f7580' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactIls(Number(v))} width={70} />
                  <ReferenceLine y={0} stroke="#14161a" strokeWidth={1.2} />
                  {b.paybackMonth && <ReferenceLine x={b.paybackMonth} stroke="#2b3cff" strokeDasharray="4 4" label={{ value: `איזון M${b.paybackMonth}`, position: 'insideTopRight', fontSize: 11, fill: '#2b3cff' }} />}
                  <Tooltip formatter={(v, name) => [formatIls(Number(v)), name]} labelFormatter={(l) => `חודש ${l}`} contentStyle={{ direction: 'rtl', fontSize: 12, borderRadius: 14, border: '1px solid #ddd6c6', boxShadow: '0 12px 32px -16px rgba(20,22,26,.4)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
                  <Area type="monotone" dataKey="base" name="בסיס" stroke="#2b3cff" strokeWidth={2.4} fill="url(#baseFill)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="opt" name="אופטימי" stroke="#0f9d6e" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="pess" name="פסימי" stroke="#e0395f" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle title="מטריצת רגישות: אימוץ מול התייעלות" sub="ROI ל-3 שנים וערך נטו. אדום = הפסד. יותר אימוץ בלי התייעלות מגדיל הפסד, כי רישוי והדרכה גדלים עם המשתמשים." />
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full border-separate border-spacing-1 text-center text-xs">
                <thead>
                  <tr><th className="p-2 text-start text-[11px] font-medium text-mute">התייעלות ↓ / אימוץ →</th>{matrix.adoptionSteps.map((a) => <th key={a} className="num p-2 text-[11px] font-medium text-mute">{a}%</th>)}</tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row, r) => (
                    <tr key={r}>
                      <td className="num p-2 text-start font-semibold text-ink-2">{matrix.efficiencySteps[r]}%</td>
                      {row.map((c) => {
                        const current = c.adoptionRate === params.adoptionRate && c.efficiencyGain === params.efficiencyGain;
                        return (
                          <td key={c.adoptionRate} onClick={() => { setParam('adoptionRate', c.adoptionRate); setParam('efficiencyGain', c.efficiencyGain); }} title="לחץ כדי לקבוע את המחוונים לערכים אלו" className={`num cursor-pointer rounded-xl p-2 transition-all hover:scale-[1.04] ${cellTone(c.netValue3y, c.roi3yPct)} ${current ? 'ring-2 ring-ink ring-offset-1 ring-offset-paper' : ''}`}>
                            <div className="font-semibold">{c.roi3yPct >= 0 ? '+' : ''}{c.roi3yPct.toFixed(0)}%</div>
                            <div className="text-[10px] opacity-75">{formatCompactIls(c.netValue3y)}{c.paybackMonth ? ` · M${c.paybackMonth}` : ''}</div>
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

      <Card tone="flat">
        <SectionTitle title="שקיפות: הנוסחאות שמאחורי המספרים" sub="כל החישוב רץ בדפדפן, בקובץ src/finance/model.ts, עם בדיקות יחידה. המודל אינו קורא לבינה מלאכותית." />
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {[
            { t: 'שעות שמתפנות בחודש (במצב יציב)', f: `${b.affectedEmployees} עובדים × ${MONTHLY_HOURS_PER_FTE} ש׳ × ${Math.round(sim.scope.processTimeShare * 100)}% נתח תהליך × ${params.adoptionRate}% אימוץ × ${params.efficiencyGain}% התייעלות × (1 − ${params.hitlOverhead}% HITL) = ${Math.round(b.monthlyHoursSavedSteady).toLocaleString('he-IL')}`, ltr: true },
            { t: 'ערך ממומש בחודש', f: `${Math.round(b.monthlyHoursSavedSteady).toLocaleString('he-IL')} ש׳ × ₪${profile.avgHourlyCostIls} × ${params.realizationRate}% מימוש = ${formatIls(b.monthlyHardValueSteady)}`, ltr: true },
            { t: 'עלויות', f: `חודש 0: הקמה ${formatIls(params.oneTimeImplementationCostIls)} + הדרכה ${formatIls(b.trainingCost)} (${b.activeUsers} × ${formatIls(params.trainingCostPerUserIls)}). כל חודש: רישוי ${formatIls(b.monthlyLicenseCostSteady)} (לפחות 50% מהמושבים משולמים מחודש 1) + תחזוקה ${formatIls(b.monthlyMaintenanceCost)}.`, ltr: false },
            { t: 'עקומת אימוץ ו-ROI', f: `S-curve (smoothstep) שמגיעה ל-100% אחרי ${params.rampMonths} חודשים. ROI ל-3 שנים = (ערך ממומש − עלות כוללת) ÷ עלות כוללת. NPV מהוון חודשית ב-${params.discountRatePct}% שנתי. אופטימי/פסימי: ±15–20 נק׳ אימוץ, ±10 נק׳ התייעלות, ±15 נק׳ מימוש, ±10–25% בעלות הקמה, ועקומת אימוץ מהירה/איטית ב-25–50%.`, ltr: false },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-line bg-white/70 p-4">
              <div className="font-semibold text-ink">{x.t}</div>
              <div className={`mt-1.5 text-xs leading-relaxed text-ink-2 ${x.ltr ? 'num' : ''}`} dir={x.ltr ? 'ltr' : undefined}>{x.f}</div>
            </div>
          ))}
        </div>
      </Card>

      <ComparisonView />
    </div>
  );
}
