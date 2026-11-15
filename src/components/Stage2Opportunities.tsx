import { useMemo, useState } from 'react';
import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, LabelList, Legend } from 'recharts';
import { AlertTriangle, ArrowLeft, Calculator, Database, Landmark, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BUY_BUILD_LABELS, type BuyVsBuild, type Initiative } from '../types/strategy';
import { TOOL_CATALOG, toolFits } from '../data/toolCatalog';
import { matchNimbusByTokens } from '../data/nimbus';
import { Badge, Button, Card, Note, SectionTitle, Segmented, StageHeader, type Tone } from './ui';
import { NimbusCatalog } from './NimbusCatalog';

const REC_TONE: Record<BuyVsBuild, Tone> = { buy: 'blue', build: 'violet', hybrid: 'emerald' };
const REC_COLOR: Record<BuyVsBuild, string> = { buy: '#2b3cff', build: '#7c5cd6', hybrid: '#0f9d6e' };
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
  const quickWins = analysis.initiatives.filter((i) => quadrant(i).label === 'Quick Win').length;
  const counts = { buy: 0, build: 0, hybrid: 0 } as Record<BuyVsBuild, number>;
  analysis.initiatives.forEach((i) => { counts[i.strategicRecommendation]++; });

  return (
    <div className="space-y-7">
      <StageHeader
        eyebrow="שלב 2 · מפת הזדמנויות והמלצות קנה או פתח"
        title={<>{profile.orgName}: <span className="text-signal">מטריצת תעדוף</span> וארכיטקטורה</>}
        actions={<>
          <Button variant="secondary" onClick={() => setCatalogOpen(true)}><Landmark className="h-4 w-4" /> קטלוג נימבוס</Button>
          <Button onClick={() => { selectScope('PORTFOLIO'); setStage(3); }}>המשך לסימולטור ROI <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></Button>
        </>}
      />

      {analysis.origin !== 'llm' && (
        <Note tone={analysis.origin === 'fallback' ? 'amber' : 'blue'} icon={<AlertTriangle className="h-4 w-4" />}>
          <b>{analysis.origin === 'fallback' ? 'שים לב: זהו תרחיש חלופי.' : 'זהו תרחיש לדוגמה.'}</b> {analysis.providerNote ?? 'המספרים הם הערכות שוק לצורך התנסות, לא ניתוח של הארגון שלך.'}
        </Note>
      )}
      {analysis.origin === 'llm' && analysis.providerNote && <div className="text-xs text-mute">{analysis.providerNote} · {new Date(analysis.generatedAt).toLocaleString('he-IL')}</div>}

      <div className="grid gap-5 lg:grid-cols-12">
        <Card tone="ink" className="lg:col-span-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/60">תמצית מנהלים</div>
          <p className="display mt-3 text-[19px] font-medium leading-relaxed text-paper md:text-[22px]">{analysis.executiveSummary}</p>
        </Card>
        <div className="stagger grid grid-cols-2 gap-3 lg:col-span-5">
          {[
            { n: analysis.initiatives.length, l: 'יוזמות ממופות', c: 'text-ink' },
            { n: quickWins, l: 'Quick Wins', c: 'text-up' },
            { n: counts.buy, l: 'קנייה', c: 'text-signal-2' },
            { n: counts.build + counts.hybrid, l: 'פיתוח / היברידי', c: 'text-[#5b43b8]' },
          ].map((x, i) => (
            <div key={x.l} style={{ '--i': i + 1 } as React.CSSProperties} className="rounded-[var(--radius-card)] border border-line bg-white/80 p-4">
              <div className={`num text-3xl font-semibold ${x.c}`}>{x.n}</div>
              <div className="mt-1 text-xs text-mute">{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <SectionTitle title="מטריצת תעדוף: אימפקט עסקי מול מאמץ יישום" sub="לחץ על נקודה כדי לקפוץ לכרטיס היוזמה. הרבעים צבועים: ירקרק = Quick Win, סגלגל = הימור אסטרטגי, ורדרד = לדחות." />
        <div dir="ltr" className="h-[22rem] w-full">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <ReferenceArea x1={0} x2={5} y1={6.5} y2={10} fill="#0f9d6e" fillOpacity={0.07} />
              <ReferenceArea x1={5} x2={10} y1={6.5} y2={10} fill="#7c5cd6" fillOpacity={0.07} />
              <ReferenceArea x1={5} x2={10} y1={0} y2={6.5} fill="#e0395f" fillOpacity={0.06} />
              <CartesianGrid stroke="#e4ddcc" strokeDasharray="2 4" />
              <XAxis type="number" dataKey="x" domain={[0, 10]} name="מאמץ" tick={{ fontSize: 11, fill: '#6f7580' }} tickLine={false} axisLine={{ stroke: '#ddd6c6' }} label={{ value: 'מאמץ ומורכבות יישום (1 נמוך · 10 גבוה)', position: 'bottom', fontSize: 12, fill: '#3b4048' }} />
              <YAxis type="number" dataKey="y" domain={[0, 10]} name="אימפקט" tick={{ fontSize: 11, fill: '#6f7580' }} tickLine={false} axisLine={false} label={{ value: 'אימפקט עסקי', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#3b4048' }} />
              <ReferenceLine x={5} stroke="#14161a" strokeOpacity={0.35} strokeDasharray="4 4" />
              <ReferenceLine y={6.5} stroke="#14161a" strokeOpacity={0.35} strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                const p = payload?.[0]?.payload as (typeof points)[number] | undefined;
                if (!p) return null;
                return <div dir="rtl" className="rounded-xl border border-line bg-paper p-2.5 text-xs shadow-lg"><b>#{p.n} {p.title}</b><div className="mt-0.5 text-mute">מאמץ <span className="num">{p.effortScore}</span> · אימפקט <span className="num">{p.impactScore}</span> · {BUY_BUILD_LABELS[p.strategicRecommendation]}</div></div>;
              }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
              {(['buy', 'build', 'hybrid'] as BuyVsBuild[]).map((rec) => (
                <Scatter key={rec} name={BUY_BUILD_LABELS[rec]} data={points.filter((p) => p.strategicRecommendation === rec)} fill={REC_COLOR[rec]} stroke="#f6f3ec" strokeWidth={2} cursor="pointer"
                  onClick={(d) => { const id = (d as unknown as { id: string }).id; setFocusId(id); document.getElementById(`init-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                  <LabelList dataKey="n" position="top" fontSize={11} fill="#14161a" fontFamily="IBM Plex Mono" />
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-2">
          <span><Badge tone="emerald">Quick Win</Badge> אימפקט גבוה, מאמץ נמוך</span>
          <span><Badge tone="violet">הימור אסטרטגי</Badge> אימפקט גבוה, מאמץ גבוה</span>
          <span><Badge tone="slate">שיפור נקודתי</Badge> אימפקט נמוך, מאמץ נמוך</span>
          <span><Badge tone="rose">לדחות</Badge> אימפקט נמוך, מאמץ גבוה</span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold">פירוט יוזמות <span className="num text-base font-medium text-mute">({analysis.initiatives.length})</span></h3>
        <Segmented value={filter} onChange={setFilter} size="md" options={[{ value: 'all', label: 'הכל' }, { value: 'buy', label: BUY_BUILD_LABELS.buy }, { value: 'build', label: BUY_BUILD_LABELS.build }, { value: 'hybrid', label: BUY_BUILD_LABELS.hybrid }]} />
      </div>

      <div className="stagger space-y-4">
        {initiatives.map((i, idx) => {
          const q = quadrant(i);
          const n = analysis.initiatives.indexOf(i) + 1;
          return (
            <Card key={i.id} style={{ '--i': idx } as React.CSSProperties} className={`transition-shadow ${focusId === i.id ? 'ring-2 ring-signal ring-offset-2 ring-offset-paper' : ''}`}>
              <div id={`init-${i.id}`} className="flex flex-wrap items-start justify-between gap-3 scroll-mt-24">
                <div className="flex gap-4">
                  <span className="num display grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-xl font-black text-paper">{n}</span>
                  <div>
                    <h4 className="text-xl font-bold leading-snug">{i.title}</h4>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge tone={REC_TONE[i.strategicRecommendation]}>{BUY_BUILD_LABELS[i.strategicRecommendation]}</Badge>
                      <Badge tone={q.tone}>{q.label}</Badge>
                      <Badge><Database className="h-3 w-3" /> {DATA_DEP_LABEL[i.dataDependency]}</Badge>
                      <span className="ms-1 text-mute">אימפקט <b className="num text-ink">{i.impactScore}</b>/10 · מאמץ <b className="num text-ink">{i.effortScore}</b>/10 · <b className="num text-ink">{i.estimatedWeeks}</b> שבועות לערך ראשון</span>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => { selectScope(i.id); setStage(3); }}><Calculator className="h-4 w-4" /> סמלץ ROI ליוזמה זו</Button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">הבעיה והפתרון</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">{i.problemAndSolution}</p>
                  <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">נימוק ההמלצה</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">{i.recommendationRationale}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute"><ShieldCheck className="h-3.5 w-3.5" /> כלים, פריסה והתאמה לרגולציה</div>
                  <div className="mt-1.5 space-y-2">
                    {i.recommendedTools.map((t, idx2) => {
                      const catalogHits = TOOL_CATALOG.filter((c) => t.tools.some((name) => name === c.name || c.name.includes(name) || name.includes(c.name.split(' ')[0])));
                      const fits = catalogHits.map((c) => ({ c, fit: toolFits(c, profile.sensitivity, profile.cloudConstraint) }));
                      const misfit = fits.filter((f) => !f.fit.fits);
                      const nimbus = nimbusBound ? matchNimbusByTokens(catalogHits.flatMap((c) => c.nimbusTokens ?? [])) : [];
                      return (
                        <div key={idx2} className="rounded-2xl border border-line bg-paper-2/50 p-3.5 text-sm">
                          <div className="font-semibold">{t.category}</div>
                          <div className="text-signal-2">{t.tools.join(' · ')}</div>
                          <div className="mt-1 text-xs text-ink-2">פריסה: {t.deployment}</div>
                          <div className="text-xs text-mute">{t.privacyFitNote}</div>
                          {misfit.length > 0 && (
                            <div className="mt-2 flex items-start gap-1 rounded-xl border border-down/30 bg-down-soft p-2 text-xs text-[#8b1a35]">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{misfit.map((m) => `${m.c.name}: ${m.fit.reason}`).join(' · ')}</span>
                            </div>
                          )}
                          {nimbus.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                              <Landmark className="h-3.5 w-3.5 text-warn" />
                              <span className="text-[#7a4a02]">מאושר בנימבוס רובד 5:</span>
                              {nimbus.slice(0, 4).map((s) => <Badge key={s.sku + s.platform} tone="amber" className="num">{s.platform} · {s.sku}</Badge>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute"><AlertTriangle className="h-3.5 w-3.5" /> חסמים, סיכונים ודרכי התמודדות</div>
                <div className="mt-1.5 grid gap-2 md:grid-cols-2">
                  {i.risks.map((r, idx3) => (
                    <div key={idx3} className="rounded-2xl border border-line p-3.5 text-sm">
                      <div className="font-semibold">{r.area}</div>
                      <div className="mt-1 text-[#8b1a35]"><span className="font-semibold">סיכון:</span> {r.risk}</div>
                      <div className="mt-0.5 text-up"><span className="font-semibold">התמודדות:</span> {r.mitigation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {analysis.sources.length > 0 && (
        <Card tone="flat">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">מקורות ואסמכתאות</div>
          <ul className="mt-2 list-inside list-disc text-sm text-signal-2">
            {analysis.sources.map((s) => <li key={s.uri}><a href={s.uri} target="_blank" rel="noreferrer" className="hover:underline">{s.title}</a></li>)}
          </ul>
        </Card>
      )}

      <NimbusCatalog open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
