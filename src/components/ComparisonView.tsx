import { useMemo } from 'react';
import { GitCompareArrows, Trash2 } from 'lucide-react';
import { useAppStore, type SavedScenario } from '../store/useAppStore';
import { formatCompactIls, formatIls, simulate, type ScenarioResult } from '../finance/model';
import { Button, Card, SectionTitle, inputCls } from './ui';

function Pick({ slot, value, options, onChange }: { slot: 0 | 1; value: string | null; options: SavedScenario[]; onChange: (slot: 0 | 1, id: string | null) => void }) {
  return (
    <select className={inputCls} value={value ?? ''} onChange={(e) => onChange(slot, e.target.value || null)}>
      <option value="">בחר תרחיש {slot === 0 ? 'א' : 'ב'}</option>
      {options.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.scopeLabel}</option>)}
    </select>
  );
}

export function ComparisonView() {
  const { analysis, savedScenarios, compareIds, setCompare, deleteScenario } = useAppStore();
  const initiatives = analysis?.initiatives ?? [];

  const [a, b] = compareIds.map((id) => savedScenarios.find((s) => s.id === id) ?? null);
  const results = useMemo(() => [a, b].map((s) => (s ? simulate(s.profile, initiatives, s.scopeId, s.params).base : null)), [a, b, initiatives]);

  if (savedScenarios.length === 0) {
    return (
      <Card>
        <SectionTitle title="השוואת תרחישים" sub='שמור שתי תצורות (למשל "רישיונות Copilot לכולם" מול "פיתוח ממוקד לשתי מחלקות") ותראה אותן זו לצד זו.' />
        <div className="flex items-center gap-2 text-sm text-mute"><GitCompareArrows className="h-4 w-4" /> עדיין לא נשמרו תרחישים. השתמש ב"שמור להשוואה" בפאנל המחוונים.</div>
      </Card>
    );
  }

  const rows: { label: string; get: (r: ScenarioResult) => number; fmt: (v: number) => string; higherIsBetter?: boolean }[] = [
    { label: 'ערך כספי נטו ל-3 שנים', get: (r) => r.netValue3y, fmt: formatCompactIls },
    { label: 'NPV', get: (r) => r.npv3y, fmt: formatCompactIls },
    { label: 'ROI ל-3 שנים', get: (r) => r.roi3yPct, fmt: (v) => `${v.toFixed(0)}%` },
    { label: 'נקודת איזון (חודש)', get: (r) => r.paybackMonth ?? 99, fmt: (v) => (v >= 99 ? '> 36' : `${v}`), higherIsBetter: false },
    { label: 'עלות כוללת ל-3 שנים', get: (r) => r.totalCost3y, fmt: formatCompactIls, higherIsBetter: false },
    { label: 'הקמה והדרכה (חודש 0)', get: (r) => r.oneTimeCost, fmt: formatCompactIls, higherIsBetter: false },
    { label: 'שעות שמתפנות בשנה', get: (r) => r.monthlyHoursSavedSteady * 12, fmt: (v) => Math.round(v).toLocaleString('he-IL') },
    { label: 'משתמשים פעילים', get: (r) => r.activeUsers, fmt: (v) => `${v}` },
  ];

  return (
    <Card>
      <SectionTitle title="השוואת תרחישים" sub="שני תרחישים שמורים, מחושבים מחדש על אותו מודל. ההפרש מוצג ביחס לתרחיש א." />
      <div className="grid gap-3 md:grid-cols-2">
        <Pick slot={0} value={compareIds[0]} options={savedScenarios} onChange={setCompare} />
        <Pick slot={1} value={compareIds[1]} options={savedScenarios} onChange={setCompare} />
      </div>
      {a && b && results[0] && results[1] && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-mute">
              <tr><th className="p-2 text-start">מדד</th><th className="p-2">{a.name}</th><th className="p-2">{b.name}</th><th className="p-2">הפרש (ב − א)</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const va = row.get(results[0]!);
                const vb = row.get(results[1]!);
                const diff = vb - va;
                const good = row.higherIsBetter === false ? diff < 0 : diff > 0;
                return (
                  <tr key={row.label} className="border-t border-line">
                    <td className="p-2 font-semibold text-ink-2">{row.label}</td>
                    <td className="num p-2 text-center">{row.fmt(va)}</td>
                    <td className="num p-2 text-center">{row.fmt(vb)}</td>
                    <td className={`num p-2 text-center font-bold ${diff === 0 ? 'text-mute' : good ? 'text-up' : 'text-down'}`}>{row.label.includes('ROI') ? `${diff >= 0 ? '+' : ''}${diff.toFixed(0)} נק׳` : row.label.includes('חודש') || row.label.includes('משתמשים') || row.label.includes('שעות') ? `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString('he-IL')}` : (diff >= 0 ? '+' : '') + formatIls(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 grid gap-2 text-xs text-mute md:grid-cols-2">
            {[a, b].map((s) => s && <div key={s.id}>{s.name}: אימוץ {s.params.adoptionRate}% · התייעלות {s.params.efficiencyGain}% · מימוש {s.params.realizationRate}% · רישוי {formatIls(s.params.monthlyLicensePerUserIls)} · הקמה {formatCompactIls(s.params.oneTimeImplementationCostIls)}</div>)}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {savedScenarios.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-paper-2/60 px-3 py-1 text-xs">
            {s.name} <span className="text-mute">· {s.scopeLabel}</span>
            <Button variant="ghost" className="!p-0.5" title="מחק" onClick={() => deleteScenario(s.id)}><Trash2 className="h-3.5 w-3.5 text-mute" /></Button>
          </span>
        ))}
      </div>
    </Card>
  );
}
