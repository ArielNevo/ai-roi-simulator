import { useMemo, useState } from 'react';
import { CheckSquare, ClipboardCopy, Download, FileSpreadsheet, Printer, Square } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { simulate } from '../finance/model';
import { buildCsv, buildMarkdown, download } from '../utils/export';
import type { GovernanceItem, KpiItem } from '../types/strategy';
import { Badge, Button, Card, SectionTitle, inputCls, type Tone } from './ui';

const KPI_TONE: Record<KpiItem['category'], Tone> = { 'אימוץ': 'blue', 'איכות ודיוק': 'violet', 'עסקי ופיננסי': 'emerald' };
const GOV_CATS: GovernanceItem['category'][] = ['אבטחת מידע ופרטיות', 'ממשל תאגידי ורגולציה', 'הכשרת עובדים ושינוי ארגוני'];

export function Stage4Plan() {
  const { analysis, profile, selectedScopeId, params, toggleGovernance, addGovernanceItem } = useAppStore();
  const [kpiFilter, setKpiFilter] = useState<'all' | KpiItem['category']>('all');
  const [newItem, setNewItem] = useState('');
  const [newCat, setNewCat] = useState<GovernanceItem['category']>('אבטחת מידע ופרטיות');
  const [copied, setCopied] = useState(false);

  const sim = useMemo(() => (analysis ? simulate(profile, analysis.initiatives, selectedScopeId, params) : null), [analysis, profile, selectedScopeId, params]);
  if (!analysis) return null;

  const scopeLabel = selectedScopeId === 'PORTFOLIO' ? 'כלל הפורטפוליו' : analysis.initiatives.find((i) => i.id === selectedScopeId)?.title ?? '';
  const done = analysis.governanceChecklist.filter((g) => g.completed).length;
  const total = analysis.governanceChecklist.length;
  const mandatoryOpen = analysis.governanceChecklist.filter((g) => g.priority === 'חובה' && !g.completed).length;
  const kpis = analysis.kpis.filter((k) => kpiFilter === 'all' || k.category === kpiFilter);
  const slug = profile.orgName.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'ai-roi';

  const copySummary = async () => {
    const b = sim!.base;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">שלב 4 · מדדים, ממשל תאגידי וייצוא</div>
          <h2 className="mt-1 text-2xl font-extrabold">יעדי OKR, מוכנות רגולטורית ודוח הנהלה</h2>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button onClick={() => download(`${slug}-ai-roi-report.md`, buildMarkdown(profile, analysis, sim, params, scopeLabel), 'text/markdown;charset=utf-8')}><Download className="h-4 w-4" /> דוח Markdown</Button>
          <Button variant="secondary" onClick={() => download(`${slug}-ai-roi-data.csv`, buildCsv(analysis, sim), 'text/csv;charset=utf-8')}><FileSpreadsheet className="h-4 w-4" /> CSV לאקסל</Button>
          <Button variant="secondary" onClick={copySummary}><ClipboardCopy className="h-4 w-4" /> {copied ? 'הועתק!' : 'העתק סיכום למצגת'}</Button>
          <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> הדפסה / PDF</Button>
        </div>
      </div>

      <Card>
        <SectionTitle title="מדדי הצלחה ויעדי OKR: רבעון 1, רבעון 2 ושנה 1" sub="שלוש שכבות: אימוץ (האם משתמשים), איכות ודיוק (האם זה נכון), עסקי ופיננסי (האם זה שווה)."
          action={
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs">
              {(['all', 'אימוץ', 'איכות ודיוק', 'עסקי ופיננסי'] as const).map((f) => <button key={f} onClick={() => setKpiFilter(f)} className={`rounded-lg px-3 py-1 ${kpiFilter === f ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}>{f === 'all' ? 'הכל' : f}</button>)}
            </div>
          } />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="p-2 text-start">קטגוריה</th><th className="p-2 text-start">מדד</th><th className="p-2">רבעון 1</th><th className="p-2">רבעון 2</th><th className="p-2">שנה 1</th><th className="p-2 text-start">אחראי</th></tr></thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.id} className="border-t border-slate-100">
                  <td className="p-2"><Badge tone={KPI_TONE[k.category]}>{k.category}</Badge></td>
                  <td className="p-2 font-medium">{k.metricName}</td>
                  <td className="num p-2 text-center">{k.q1Target}</td>
                  <td className="num p-2 text-center">{k.q2Target}</td>
                  <td className="num p-2 text-center font-semibold text-emerald-700">{k.year1Target}</td>
                  <td className="p-2 text-slate-600">{k.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle title="צ'קליסט ממשל תאגידי, אבטחת מידע והכשרה" sub="סעיפי חובה הם תנאי ליציאה לדרך. סמן מה הושלם." action={
          <div className="text-end text-sm">
            <div className="num font-bold">{done} / {total} הושלמו</div>
            <div className={`text-xs ${mandatoryOpen ? 'text-rose-600' : 'text-emerald-600'}`}>{mandatoryOpen ? `${mandatoryOpen} סעיפי חובה פתוחים` : 'כל סעיפי החובה הושלמו'}</div>
          </div>
        } />
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        {GOV_CATS.map((cat) => {
          const items = analysis.governanceChecklist.filter((g) => g.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="mb-4">
              <div className="mb-2 text-sm font-bold text-slate-700">{cat}</div>
              <div className="space-y-2">
                {items.map((g) => (
                  <button key={g.id} onClick={() => toggleGovernance(g.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-start transition ${g.completed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                    {g.completed ? <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Square className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
                    <span>
                      <span className="flex items-center gap-2"><Badge tone={g.priority === 'חובה' ? 'rose' : 'slate'}>{g.priority}</Badge><span className={`font-semibold ${g.completed ? 'line-through text-slate-500' : ''}`}>{g.title}</span></span>
                      <span className="mt-1 block text-xs text-slate-600">{g.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className="no-print mt-3 flex flex-wrap gap-2">
          <select className={`${inputCls} max-w-xs`} value={newCat} onChange={(e) => setNewCat(e.target.value as GovernanceItem['category'])}>{GOV_CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input className={`${inputCls} flex-1`} placeholder="הוסף דרישה מותאמת לארגון…" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
          <Button variant="secondary" disabled={!newItem.trim()} onClick={() => { addGovernanceItem({ category: newCat, title: newItem.trim() }); setNewItem(''); }}>הוסף</Button>
        </div>
      </Card>
    </div>
  );
}
