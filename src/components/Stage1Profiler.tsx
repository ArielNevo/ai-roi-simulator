import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, FileText, Landmark, Loader2, Scale, Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PRESETS } from '../data/presets';
import {
  BOTTLENECK_OPTIONS,
  CLOUD_CONSTRAINT_LABELS,
  ORG_TYPE_LABELS,
  SENSITIVITY_LABELS,
  type CloudConstraint,
  type DataSensitivity,
  type OrgType,
} from '../types/strategy';
import { Button, Card, Field, SectionTitle, inputCls } from './ui';

const ICONS = { university: Building2, government: Landmark, law: Scale };

export function Stage1Profiler() {
  const { profile, setProfile, loadPreset, startAnalysis, isAnalyzing, analysisStep, errorMsg, analysis, setStage } = useAppStore();
  const [health, setHealth] = useState<{ provider: string } | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">שלב 1 · אבחון ארגוני</div>
          <h2 className="mt-1 text-2xl font-extrabold">אפיון הארגון, רגישות המידע וצווארי הבקבוק</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            הזן את נתוני הארגון או טען תרחיש לדוגמה. הניתוח ימפה 4–6 יוזמות AI, ימליץ על קנייה מול פיתוח בהתאם למגבלות הענן והרגולציה (כולל נימבוס לגופים ממשלתיים), ויכין נקודת פתיחה לסימולטור הפיננסי.
          </p>
        </div>
        {analysis && (
          <Button variant="secondary" onClick={() => setStage(2)}>
            צפה בתוצאות הקיימות <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PRESETS.map((p) => {
          const Icon = ICONS[p.icon];
          return (
            <button key={p.id} onClick={() => loadPreset(p.id)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-blue-400 hover:shadow">
              <div className="flex items-center gap-2 text-blue-700"><Icon className="h-5 w-5" /><span className="text-xs font-semibold">תרחיש לדוגמה</span></div>
              <div className="mt-2 font-bold text-slate-900">{p.title}</div>
              <div className="mt-1 text-xs text-slate-500">{p.subtitle}</div>
            </button>
          );
        })}
      </div>

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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold text-slate-700">רמת רגישות מידע ודרישות רגולציה</div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as DataSensitivity[]).map((s) => (
                <button key={s} onClick={() => setProfile({ sensitivity: s })} className={`rounded-xl border p-3 text-start transition ${profile.sensitivity === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                  <div className="text-sm font-bold">{SENSITIVITY_LABELS[s].title}</div>
                  <div className={`text-xs ${profile.sensitivity === s ? 'text-slate-300' : 'text-slate-500'}`}>{SENSITIVITY_LABELS[s].sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700"><span>בשלות דאטה נוכחית (1–5)</span><span className="num text-blue-700">{profile.dataMaturity}</span></div>
            <input type="range" aria-label="בשלות דאטה" min={1} max={5} step={1} value={profile.dataMaturity} onChange={(e) => setProfile({ dataMaturity: Number(e.target.value) })} className="w-full" />
            <div className="mt-1 flex justify-between text-xs text-slate-500"><span>1 · מידע מפוזר, ללא בעלות</span><span>5 · דאטה מנוהל, נגיש ומתועד</span></div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1 text-sm font-semibold text-slate-700">צווארי בקבוק מרכזיים (בחירה מרובה)</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {BOTTLENECK_OPTIONS.map((b) => {
              const on = profile.bottlenecks.includes(b);
              return <button key={b} onClick={() => toggleBottleneck(b)} className={`rounded-xl border px-3 py-2 text-sm transition ${on ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>{b}</button>;
            })}
          </div>
        </div>

        <div className="mt-5">
          <Field label="תיאור חופשי של התהליכים, המערכות הקיימות והאתגרים">
            <textarea className={`${inputCls} min-h-28`} value={profile.freeTextContext} onChange={(e) => setProfile({ freeTextContext: e.target.value })} placeholder="כמה פניות בחודש, אילו מערכות ליבה, מה כואב, מה כבר נוסה…" />
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-1 text-sm font-semibold text-slate-700">מסמך רקע / תוכנית עבודה (אופציונלי · txt, md, csv)</div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 hover:border-blue-400">
            <Upload className="h-4 w-4" />
            {profile.uploadedFileName ? <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{profile.uploadedFileName} ({(profile.uploadedTextContent?.length ?? 0).toLocaleString('he-IL')} תווים)</span> : 'לחץ לבחירת קובץ או גרור לכאן'}
            <input type="file" accept=".txt,.md,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={startAnalysis} disabled={!canAnalyze} className="w-full py-3 text-base">
            {isAnalyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> {analysisStep || 'מנתח…'}</> : <>נתח הזדמנויות ובנה מפת דרכים <ArrowLeft className="h-5 w-5" /></>}
          </Button>
          <p className="text-center text-xs text-slate-500">
            {providerLabel
              ? `הניתוח ירוץ על ${providerLabel} עם פלט מובנה ומאומת. אם הספק נכשל, תוצג חלופה מובנית ותקבל על כך הודעה.`
              : 'לא מוגדר ספק מודל (LLM_PROVIDER=none): הניתוח יחזיר את התרחיש המובנה הקרוב ביותר לפרופיל. הסימולטור הפיננסי עובד במלואו גם כך.'}
          </p>
          {errorMsg && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{errorMsg}</div>}
        </div>
      </Card>
    </div>
  );
}
