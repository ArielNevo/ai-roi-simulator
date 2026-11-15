import { useMemo, useState } from 'react';
import { CheckSquare, ClipboardCopy, Download, FileSpreadsheet, Printer, Square } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCompactIls, simulate } from '../finance/model';
import { buildCsv, buildMarkdown, download } from '../utils/export';
import type { GovernanceItem, KpiItem } from '../types/strategy';
import { Badge, Button, Card, SectionTitle, Segmented, StageHeader, inputCls, type Tone } from './ui';

const KPI_TONE: Record<KpiItem['category'], Tone> = { 'אימוץ': 'blue', 'איכות ודיוק': 'violet', 'עסקי ופיננסי': 'emerald' };
const GOV_CATS: GovernanceItem['category'][] = ['אבטחת מידע ופרטיות', 'ממשל תאגידי ורגולציה', 'הכשרת עובדים ושינוי ארגוני'];

export function Stage4Plan() {
  const { analysis, profile, selectedScopeId, params, toggleGovernance, addGovernanceItem } = useAppStore();
  const [kpiFilter, setKpiFilter] = useState<'all' | KpiItem['category']>('all');
  const [newItem, setNewItem] = useState('');
  const [newCat, setNewCat] = useState<GovernanceItem['category']>('אבטחת מידע ופרטיות');
  const [copied, setCopied] = useState(false);

  const sim = useMemo(() => (analysis ? simulate(profile, analysis.initiatives, selectedScopeId, params) : null), [analysis, profile, selectedScopeId, params]);
  if (!analysis || !sim) return null;

  const scopeLabel = selectedScopeId === 'PORTFOLIO' ? 'כלל הפורטפוליו' : analysis.initiatives.find((i) => i.id === selectedScopeId)?.title ?? '';
  const done = analysis.governanceChecklist.filter((g) => g.completed).length;
  const total = analysis.governanceChecklist.length;
  const mandatoryOpen = analysis.governanceChecklist.filter((g) => g.priority === 'חובה' && !g.completed).length;
  const kpis = analysis.kpis.filter((k) => kpiFilter === 'all' || k.category === kpiFilter);
  const slug = profile.orgName.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'ai-roi';
  const b = sim.base;

  const copySummary = async () => {
    const text = [
      `${profile.orgName}: אסטרטגיית AI ו-ROI`,
      analysis.executiveSummary,
      `יוזמות: ${analysis.initiatives.map((i, idx) => `${idx + 1}) ${i.title} (${i.strategicRecommendation})`).join('; ')}`,
      `${scopeLabel}: ערך נטו ל-3 שנים ${Math.round(b.netValue3y).toLocaleString('he-IL')} ₪, ROI ${b.roi3yPct.toFixed(0)}%, נקודת איזון ${b.paybackMonth ? 'חודש ' + b.paybackMonth : 'מעבר ל-36 חודשים'}, שעות שמתפנות בשנה ${Math.round(b.monthlyHoursSavedSteady * 12).toLocaleString('he-IL')}.`,
      `הנחות: אימוץ ${params.adoptionRate}%, התייעלות ${params.efficiencyGain}%, HITL ${params.hitlOverhead}%, מימוש ${params.realizationRate}%.`,
      `ממשל: ${done}/${total} סעיפים הושלמו, ${mandatoryOpen} סעיפי חובה פתוחים.`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-7">
      <StageHeader
        eyebrow="שלב 4 · מדדים, ממשל תאגידי וייצוא"
        title="יעדי OKR, מוכנות רגולטורית ודוח הנהלה"
        sub={`${scopeLabel}: ערך נטו ${formatCompactIls(b.netValue3y)} ל-3 שנים, ROI ${b.roi3yPct.toFixed(0)}%, ${b.paybackMonth ? `איזון בחודש ${b.paybackMonth}` : 'ללא איזון באופק'}.`}
        actions={<div className="no-print flex flex-wrap gap-2">
          <Button onClick={() => download(`${slug}-ai-roi-report.md`, buildMarkdown(profile, analysis, sim, params, scopeLabel), 'text/markdown;charset=utf-8')}><Download className="h-4 w-4" /> דוח Markdown</Button>
          <Button variant="secondary" onClick={() => download(`${slug}-ai-roi-data.csv`, buildCsv(analysis, sim), 'text/csv;charset=utf-8')}><FileSpreadsheet className="h-4 w-4" /> CSV</Button>
          <Button variant="secondary" onClick={copySummary}><ClipboardCopy className="h-4 w-4" /> {copied ? 'הועתק!' : 'סיכום למצגת'}</Button>
          <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> PDF</Button>
        </div>}
      />

      <Card>
        <SectionTitle title="מדדי הצלחה ויעדי OKR: רבעון 1, רבעון 2 ושנה 1" sub="שלוש שכבות: אימוץ (האם משתמשים), איכות ודיוק (האם זה נכון), עסקי ופיננסי (האם זה שווה)."
          action={<Segmented value={kpiFilter} onChange={setKpiFilter} options={[{ value: 'all', label: 'הכל' }, { value: 'אימוץ', label: 'אימוץ' }, { value: 'איכות ודיוק', label: 'איכות ודיוק' }, { value: 'עסקי ופיננסי', label: 'עסקי ופיננסי' }]} />} />
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-mute"><tr><th className="p-2.5 text-start">קטגוריה</th><th className="p-2.5 text-start">מדד</th><th className="p-2.5">רבעון 1</th><th className="p-2.5">רבעון 2</th><th className="p-2.5">שנה 1</th><th className="p-2.5 text-start">אחראי</th></tr></thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.id} className="border-t border-line transition-colors hover:bg-paper-2/50">
                  <td className="p-2.5"><Badge tone={KPI_TONE[k.category]}>{k.category}</Badge></td>
                  <td className="p-2.5 font-medium">{k.metricName}</td>
                  <td className="num p-2.5 text-center text-ink-2">{k.q1Target}</td>
                  <td className="num p-2.5 text-center text-ink-2">{k.q2Target}</td>
                  <td className="num p-2.5 text-center font-semibold text-up">{k.year1Target}</td>
                  <td className="p-2.5 text-mute">{k.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle title="צ'קליסט ממשל תאגידי, אבטחת מידע והכשרה" sub="סעיפי חובה הם תנאי ליציאה לדרך. סמן מה הושלם." action={
          <div className="text-end">
            <div className="num text-2xl font-semibold leading-none">{done}<span className="text-mute">/{total}</span></div>
            <div className={`mt-1 text-xs ${mandatoryOpen ? 'text-down' : 'text-up'}`}>{mandatoryOpen ? `${mandatoryOpen} סעיפי חובה פתוחים` : 'כל סעיפי החובה הושלמו'}</div>
          </div>
        } />
        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-gradient-to-l from-signal to-up transition-all duration-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        <div className="grid gap-5 lg:grid-cols-3">
          {GOV_CATS.map((cat) => {
            const items = analysis.governanceChecklist.filter((g) => g.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">{cat}</div>
                <div className="space-y-2">
                  {items.map((g) => (
                    <button key={g.id} onClick={() => toggleGovernance(g.id)} aria-pressed={g.completed} className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-start transition-all ${g.completed ? 'border-up/30 bg-up-soft' : 'border-line bg-white hover:border-ink hover:-translate-y-px'}`}>
                      {g.completed ? <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-up" /> : <Square className="mt-0.5 h-5 w-5 shrink-0 text-mute/60" />}
                      <span>
                        <span className="flex flex-wrap items-center gap-2"><Badge tone={g.priority === 'חובה' ? 'rose' : 'slate'}>{g.priority}</Badge><span className={`text-sm font-semibold ${g.completed ? 'text-mute line-through' : ''}`}>{g.title}</span></span>
                        <span className="mt-1 block text-xs leading-relaxed text-mute">{g.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="no-print mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
          <select className={`${inputCls} max-w-xs`} value={newCat} onChange={(e) => setNewCat(e.target.value as GovernanceItem['category'])}>{GOV_CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input className={`${inputCls} flex-1`} placeholder="הוסף דרישה מותאמת לארגון…" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
          <Button variant="secondary" disabled={!newItem.trim()} onClick={() => { addGovernanceItem({ category: newCat, title: newItem.trim() }); setNewItem(''); }}>הוסף</Button>
        </div>
      </Card>
    </div>
  );
}
