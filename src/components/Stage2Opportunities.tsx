import { useMemo, useState } from 'react';
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { AlertTriangle, ArrowLeft, Calculator, Database, Landmark, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BUY_BUILD_LABELS, type BuyVsBuild, type Initiative } from '../types/strategy';
import { TOOL_CATALOG, toolFits } from '../data/toolCatalog';
import { matchNimbusByTokens } from '../data/nimbus';
import { Badge, Button, Card, SectionTitle, type Tone } from './ui';
import { NimbusCatalog } from './NimbusCatalog';

const REC_TONE: Record<BuyVsBuild, Tone> = { buy: 'blue', build: 'violet', hybrid: 'emerald' };
const DATA_DEP_LABEL = { low: 'תלות נמוכה בדאטה פנימי', medium: 'תלות בינונית בדאטה פנימי', high: 'תלות גבוהה בדאטה פנימי' };

function quadrant(i: Initiative): { label: string; tone: Tone } {
  const high = i.impactScore >= 6.5;
  const easy = i.effortScore <= 5;
  if (high && easy) return { label: 'Quick Win', tone: 'emerald' };
  if (high && !easy) return { label: 'הימור אסטרטגי', tone: 'violet' };
  if (!high && easy) return { label: 'שיפור נקודתי', tone: 'slate' };
  return { label: 'לדחות', tone: 'rose' };
}

export function Stage2Opportunities() {
  const { analysis, profile, selectScope, setStage } = useAppStore();
  const [filter, setFilter] = useState<'all' | BuyVsBuild>('all');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const nimbusBound = profile.cloudConstraint === 'nimbus' || profile.orgType === 'government';

  const initiatives = useMemo(() => (analysis?.initiatives ?? []).filter((i) => filter === 'all' || i.strategicRecommendation === filter), [analysis, filter]);
  if (!analysis) return null;

  const points = analysis.initiatives.map((i, idx) => ({ ...i, n: idx + 1, x: i.effortScore, y: i.impactScore }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">שלב 2 · מפת הזדמנויות והמלצות קנה או פתח</div>
          <h2 className="mt-1 text-2xl font-extrabold">{profile.orgName}: מטריצת תעדוף וארכיטקטורה</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCatalogOpen(true)}><Landmark className="h-4 w-4" /> קטלוג נימבוס</Button>
          <Button onClick={() => { selectScope('PORTFOLIO'); setStage(3); }}>המשך לסימולטור ROI <ArrowLeft className="h-4 w-4" /></Button>
        </div>
      </div>

      {analysis.origin !== 'llm' && (
        <div className={`rounded-xl border p-3 text-sm ${analysis.origin === 'fallback' ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
          <b>{analysis.origin === 'fallback' ? 'שים לב: זהו תרחיש חלופי.' : 'זהו תרחיש לדוגמה.'}</b> {analysis.providerNote ?? 'המספרים הם הערכות שוק לצורך התנסות, לא ניתוח של הארגון שלך.'}
        </div>
      )}
      {analysis.origin === 'llm' && analysis.providerNote && <div className="text-xs text-slate-500">{analysis.providerNote} · {new Date(analysis.generatedAt).toLocaleString('he-IL')}</div>}

      <Card>
        <div className="text-xs font-semibold text-blue-700">תמצית מנהלים</div>
        <p className="mt-2 leading-relaxed text-slate-800">{analysis.executiveSummary}</p>
      </Card>

      <Card>
        <SectionTitle title="מטריצת תעדוף: אימפקט עסקי מול מאמץ יישום" sub="לחץ על נקודה כדי לקפוץ לכרטיס היוזמה. הקו המקווקו מפריד בין Quick Wins (ימין-למעלה בגרף LTR) להימורים אסטרטגיים." />
        <div dir="ltr" className="h-80 w-full">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="x" domain={[0, 10]} name="מאמץ" tick={{ fontSize: 12 }} label={{ value: 'מאמץ ומורכבות יישום (1 נמוך · 10 גבוה)', position: 'bottom', fontSize: 12 }} />
              <YAxis type="number" dataKey="y" domain={[0, 10]} name="אימפקט" tick={{ fontSize: 12 }} label={{ value: 'אימפקט עסקי', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <ReferenceLine x={5} stroke="#94a3b8" strokeDasharray="4 4" />
              <ReferenceLine y={6.5} stroke="#94a3b8" strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                const p = payload?.[0]?.payload as (typeof points)[number] | undefined;
                if (!p) return null;
                return <div dir="rtl" className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow"><b>#{p.n} {p.title}</b><div>מאמץ {p.effortScore} · אימפקט {p.impactScore} · {BUY_BUILD_LABELS[p.strategicRecommendation]}</div></div>;
              }} />
              <Scatter data={points} fill="#1d4ed8" onClick={(d) => { const id = (d as unknown as { id: string }).id; setFocusId(id); document.getElementById(`init-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} cursor="pointer">
                <LabelList dataKey="n" position="top" fontSize={11} fill="#1e293b" />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
          <span><Badge tone="emerald">Quick Win</Badge> אימפקט גבוה, מאמץ נמוך</span>
          <span><Badge tone="violet">הימור אסטרטגי</Badge> אימפקט גבוה, מאמץ גבוה</span>
          <span><Badge tone="slate">שיפור נקודתי</Badge> אימפקט נמוך, מאמץ נמוך</span>
          <span><Badge tone="rose">לדחות</Badge> אימפקט נמוך, מאמץ גבוה</span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold">פירוט יוזמות ({analysis.initiatives.length})</h3>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm">
          {(['all', 'buy', 'build', 'hybrid'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1 ${filter === f ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}>{f === 'all' ? 'הכל' : BUY_BUILD_LABELS[f]}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {initiatives.map((i) => {
          const q = quadrant(i);
          const n = analysis.initiatives.indexOf(i) + 1;
          return (
            <Card key={i.id} className={focusId === i.id ? 'ring-2 ring-blue-500' : ''}>
              <div id={`init-${i.id}`} className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="num font-bold text-slate-400">#{n}</span>
                    <Badge tone={REC_TONE[i.strategicRecommendation]}>{BUY_BUILD_LABELS[i.strategicRecommendation]}</Badge>
                    <Badge tone={q.tone}>{q.label}</Badge>
                    <Badge><Database className="h-3 w-3" /> {DATA_DEP_LABEL[i.dataDependency]}</Badge>
                    <span className="text-slate-500">אימפקט <b className="num">{i.impactScore}</b>/10 · מאמץ <b className="num">{i.effortScore}</b>/10 · <b className="num">{i.estimatedWeeks}</b> שבועות לערך ראשון</span>
                  </div>
                  <h4 className="mt-2 text-xl font-bold">{i.title}</h4>
                </div>
                <Button variant="secondary" onClick={() => { selectScope(i.id); setStage(3); }}><Calculator className="h-4 w-4" /> סמלץ ROI ליוזמה זו</Button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500">הבעיה והפתרון</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-800">{i.problemAndSolution}</p>
                  <div className="mt-3 text-xs font-semibold text-slate-500">נימוק ההמלצה</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-800">{i.recommendationRationale}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> כלים, פריסה והתאמה לרגולציה</div>
                  <div className="mt-1 space-y-2">
                    {i.recommendedTools.map((t, idx) => {
                      const catalogHits = TOOL_CATALOG.filter((c) => t.tools.some((name) => name === c.name || c.name.includes(name) || name.includes(c.name.split(' ')[0])));
                      const fits = catalogHits.map((c) => ({ c, fit: toolFits(c, profile.sensitivity, profile.cloudConstraint) }));
                      const misfit = fits.filter((f) => !f.fit.fits);
                      const nimbus = nimbusBound ? matchNimbusByTokens(catalogHits.flatMap((c) => c.nimbusTokens ?? [])) : [];
                      return (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="font-semibold">{t.category}</div>
                          <div className="text-blue-800">{t.tools.join(' · ')}</div>
                          <div className="mt-1 text-xs text-slate-600">פריסה: {t.deployment}</div>
                          <div className="text-xs text-slate-600">{t.privacyFitNote}</div>
                          {misfit.length > 0 && (
                            <div className="mt-2 flex items-start gap-1 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{misfit.map((m) => `${m.c.name}: ${m.fit.reason}`).join(' · ')}</span>
                            </div>
                          )}
                          {nimbus.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                              <Landmark className="h-3.5 w-3.5 text-amber-700" />
                              <span className="text-amber-800">מאושר בנימבוס רובד 5:</span>
                              {nimbus.slice(0, 4).map((s) => <Badge key={s.sku + s.platform} tone="amber" className="num">{s.platform} · {s.sku}</Badge>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500"><AlertTriangle className="h-3.5 w-3.5" /> חסמים, סיכונים ודרכי התמודדות</div>
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  {i.risks.map((r, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <div className="font-semibold">{r.area}</div>
                      <div className="text-rose-700"><span className="font-semibold">סיכון:</span> {r.risk}</div>
                      <div className="text-emerald-700"><span className="font-semibold">התמודדות:</span> {r.mitigation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {analysis.sources.length > 0 && (
        <Card>
          <div className="text-xs font-semibold text-slate-500">מקורות ואסמכתאות</div>
          <ul className="mt-2 list-inside list-disc text-sm text-blue-800">
            {analysis.sources.map((s) => <li key={s.uri}><a href={s.uri} target="_blank" rel="noreferrer" className="hover:underline">{s.title}</a></li>)}
          </ul>
        </Card>
      )}

      <NimbusCatalog open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
