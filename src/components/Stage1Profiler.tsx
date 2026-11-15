import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText, Loader2, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  BOTTLENECK_OPTIONS,
  CLOUD_CONSTRAINT_LABELS,
  ORG_TYPE_LABELS,
  SENSITIVITY_LABELS,
  type CloudConstraint,
  type DataSensitivity,
  type OrgType,
} from '../types/strategy';
import { Button, Card, Eyebrow, Field, SectionTitle, inputCls } from './ui';
import { Hero } from './Hero';

export function Stage1Profiler() {
  const { profile, setProfile, startAnalysis, isAnalyzing, analysisStep, errorMsg, analysis, setStage } = useAppStore();
  const [health, setHealth] = useState<{ provider: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/health`.replace(/\/{2,}/g, '/')).then((r) => r.json()).then(setHealth).catch(() => setHealth(null));
  }, []);

  const toggleBottleneck = (b: string) => {
    const has = profile.bottlenecks.includes(b);
    setProfile({ bottlenecks: has ? profile.bottlenecks.filter((x) => x !== b) : [...profile.bottlenecks, b] });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(txt|md|csv)$/i.test(file.name)) {
      alert('בגרסה זו נתמכים קבצי טקסט (txt / md / csv). עבור PDF, העתק את הטקסט לתיבה "תיאור חופשי".');
      return;
    }
    const text = (await file.text()).slice(0, 60000);
    setProfile({ uploadedFileName: file.name, uploadedTextContent: text });
  };

  const canAnalyze = profile.orgName.trim().length > 0 && profile.sector.trim().length > 0 && !isAnalyzing;
  const providerLabel = health?.provider === 'gemini' ? 'Gemini' : health?.provider === 'claude' ? 'Claude' : null;
  const completeness = [profile.orgName, profile.sector, profile.bottlenecks.length, profile.freeTextContext].filter(Boolean).length;

  return (
    <div className="space-y-10">
      {!analysis && <Hero onStart={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}

      <div ref={formRef} className="scroll-mt-24 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>שלב 1 · אבחון ארגוני</Eyebrow>
            <h2 className="mt-2 text-3xl font-black leading-tight md:text-[2.4rem]">אפיון הארגון, רגישות המידע וצווארי הבקבוק</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
              הניתוח ימפה 4–6 יוזמות, ימליץ על קנייה מול פיתוח בהתאם למגבלות הענן והרגולציה (כולל נימבוס לגופים ממשלתיים), ויכין נקודת פתיחה לסימולטור.
            </p>
          </div>
          {analysis && (
            <Button variant="secondary" onClick={() => setStage(2)}>
              צפה בתוצאות הקיימות <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <Card>
              <SectionTitle title="פרטי ארגון, תשתית ועלויות עבודה" sub="נתונים אלו משמשים לחישוב פוטנציאל החיסכון ונקודת האיזון. כל מספר שתזין יסומן בהמשך כ'מהקלט שלך'." />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="שם הארגון או היחידה"><input className={inputCls} value={profile.orgName} onChange={(e) => setProfile({ orgName: e.target.value })} placeholder="למשל: רשות התאגידים" /></Field>
                <Field label="מגזר ותחום פעילות"><input className={inputCls} value={profile.sector} onChange={(e) => setProfile({ sector: e.target.value })} placeholder="למשל: רישום ופיקוח על תאגידים" /></Field>
                <Field label="סוג הארגון">
                  <select className={inputCls} value={profile.orgType} onChange={(e) => setProfile({ orgType: e.target.value as OrgType, cloudConstraint: e.target.value === 'government' ? 'nimbus' : profile.cloudConstraint })}>
                    {(Object.keys(ORG_TYPE_LABELS) as OrgType[]).map((k) => <option key={k} value={k}>{ORG_TYPE_LABELS[k]}</option>)}
                  </select>
                </Field>
                <Field label="מגבלת ענן ופריסה" hint={profile.cloudConstraint === 'nimbus' ? 'ההמלצות יוגבלו לשירותי רובד 1 ורובד 5 בנימבוס או לפריסה מקומית.' : undefined}>
                  <select className={inputCls} value={profile.cloudConstraint} onChange={(e) => setProfile({ cloudConstraint: e.target.value as CloudConstraint })}>
                    {(Object.keys(CLOUD_CONSTRAINT_LABELS) as CloudConstraint[]).map((k) => <option key={k} value={k}>{CLOUD_CONSTRAINT_LABELS[k]}</option>)}
                  </select>
                </Field>
                <Field label="מספר עובדים רלוונטיים לתהליכים"><input type="number" min={1} className={`${inputCls} num`} value={profile.relevantEmployees} onChange={(e) => setProfile({ relevantEmployees: Math.max(1, Number(e.target.value) || 1) })} /></Field>
                <Field label="עלות שעת עבודה ממוצעת (עלות מעביד, ₪)"><input type="number" min={20} className={`${inputCls} num`} value={profile.avgHourlyCostIls} onChange={(e) => setProfile({ avgHourlyCostIls: Math.max(20, Number(e.target.value) || 20) })} /></Field>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[13px] font-semibold text-ink-2">רמת רגישות מידע ודרישות רגולציה</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as DataSensitivity[]).map((s) => {
                      const on = profile.sensitivity === s;
                      return (
                        <button key={s} onClick={() => setProfile({ sensitivity: s })} className={`rounded-2xl border p-3 text-start transition-all ${on ? 'border-ink bg-ink text-paper shadow-[0_10px_24px_-14px_rgba(20,22,26,0.8)]' : 'border-line bg-white hover:border-ink'}`}>
                          <div className="text-sm font-bold">{SENSITIVITY_LABELS[s].title}</div>
                          <div className={`mt-0.5 text-[11px] leading-snug ${on ? 'text-paper/70' : 'text-mute'}`}>{SENSITIVITY_LABELS[s].sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-ink-2"><span>בשלות דאטה נוכחית (1–5)</span><span className="num rounded-md bg-paper-2 px-1.5 text-ink">{profile.dataMaturity}</span></div>
                  <input type="range" aria-label="בשלות דאטה" min={1} max={5} step={1} value={profile.dataMaturity} style={{ '--fill': `${((profile.dataMaturity - 1) / 4) * 100}%` } as React.CSSProperties} onChange={(e) => setProfile({ dataMaturity: Number(e.target.value) })} />
                  <div className="-mt-1 flex justify-between text-[11px] text-mute"><span>1 · מידע מפוזר, ללא בעלות</span><span>5 · דאטה מנוהל, נגיש ומתועד</span></div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-1.5 text-[13px] font-semibold text-ink-2">צווארי בקבוק מרכזיים (בחירה מרובה)</div>
                <div className="flex flex-wrap gap-2">
                  {BOTTLENECK_OPTIONS.map((b) => {
                    const on = profile.bottlenecks.includes(b);
                    return <button key={b} onClick={() => toggleBottleneck(b)} aria-pressed={on} className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${on ? 'border-signal bg-signal text-white shadow-[0_8px_20px_-10px_rgba(43,60,255,0.8)]' : 'border-line bg-white text-ink-2 hover:border-ink'}`}>{b}</button>;
                  })}
                </div>
              </div>

              <div className="mt-6">
                <Field label="תיאור חופשי של התהליכים, המערכות הקיימות והאתגרים">
                  <textarea className={`${inputCls} min-h-28`} value={profile.freeTextContext} onChange={(e) => setProfile({ freeTextContext: e.target.value })} placeholder="כמה פניות בחודש, אילו מערכות ליבה, מה כואב, מה כבר נוסה…" />
                </Field>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 text-[13px] font-semibold text-ink-2">מסמך רקע / תוכנית עבודה (אופציונלי · txt, md, csv)</div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-paper-2/50 px-4 py-5 text-sm text-ink-2 transition hover:border-ink hover:bg-paper-2">
                  <Upload className="h-4 w-4" />
                  {profile.uploadedFileName ? <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{profile.uploadedFileName} (<span className="num">{(profile.uploadedTextContent?.length ?? 0).toLocaleString('he-IL')}</span> תווים)</span> : 'לחץ לבחירת קובץ או גרור לכאן'}
                  <input type="file" accept=".txt,.md,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card tone="ink">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/60"><Sparkles className="h-3.5 w-3.5" /> מה יקרה עכשיו</div>
                <ol className="mt-4 space-y-3 text-sm">
                  {['מיפוי 4–6 יוזמות על מטריצת אימפקט-מאמץ', 'המלצת קנייה / פיתוח / היברידי לכל יוזמה, עם כלים שעומדים ברגולציה', 'ברירות מחדל פיננסיות לסימולטור, מסומנות כהערכת שוק'].map((s, i) => (
                    <li key={s} className="flex gap-3"><span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper/15 text-[11px] text-paper">{i + 1}</span><span className="text-paper/90">{s}</span></li>
                  ))}
                </ol>
                <div className="mt-5 border-t border-paper/15 pt-4">
                  <div className="flex items-center justify-between text-xs text-paper/60"><span>שלמות הפרופיל</span><span className="num">{completeness}/4</span></div>
                  <div className="mt-2 flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < completeness ? 'bg-signal' : 'bg-paper/15'}`} />)}</div>
                </div>
                <Button variant="signal" onClick={startAnalysis} disabled={!canAnalyze} className="mt-5 w-full py-3 text-base">
                  {isAnalyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> {analysisStep || 'מנתח…'}</> : <>נתח הזדמנויות ובנה מפת דרכים <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" /></>}
                </Button>
                <p className="mt-3 text-[11px] leading-relaxed text-paper/60">
                  {providerLabel
                    ? `הניתוח ירוץ על ${providerLabel} עם פלט מובנה ומאומת. אם הספק נכשל, תוצג חלופה מובנית ותקבל על כך הודעה.`
                    : 'לא מוגדר ספק מודל: הניתוח יחזיר את התרחיש המובנה הקרוב ביותר לפרופיל. הסימולטור הפיננסי עובד במלואו גם כך.'}
                </p>
                {errorMsg && <div className="mt-3 rounded-xl border border-down/40 bg-down/20 p-3 text-xs text-paper">{errorMsg}</div>}
              </Card>
              <div className="flex items-start gap-2 px-1 text-xs text-mute"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> הנתונים נשמרים בדפדפן שלך בלבד. הם נשלחים לשרת רק בלחיצה על "נתח".</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
