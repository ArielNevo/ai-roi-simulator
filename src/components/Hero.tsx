import { useState } from 'react';
import { ArrowDown, ArrowLeft, Building2, Landmark, Scale } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PRESETS } from '../data/presets';
import { nimbusStats } from '../data/nimbus';
import { TOOL_CATALOG } from '../data/toolCatalog';
import { GenerativeLandscape } from './GenerativeLandscape';
import { Logo } from './Logo';
import { Presenter } from './Presenter';
import { Button } from './ui';

const MEDIA = `${import.meta.env.BASE_URL}media/`.replace(/\/{2,}/g, '/');

const ICONS = { university: Building2, government: Landmark, law: Scale };


export function Hero({ onStart }: { onStart: () => void }) {
  const loadPreset = useAppStore((s) => s.loadPreset);
  const [imageOk, setImageOk] = useState(true);
  const stats = nimbusStats();
  const facts = [
    { n: PRESETS.length, label: 'תרחישים ישראליים מוכנים' },
    { n: stats.total, label: 'שירותים מאושרים בנימבוס רובד 5' },
    { n: TOOL_CATALOG.length, label: 'כלים בקטלוג, מסוננים לפי רגולציה' },
    { n: 36, label: 'חודשי תזרים בשלושה תרחישים' },
  ];

  return (
    <div className="space-y-5">
      <section className="grain relative overflow-hidden rounded-[2rem] border border-line bg-paper-2 shadow-[0_30px_80px_-50px_rgba(20,22,26,0.5)]">
        <div className="absolute inset-0">
          {imageOk ? (
            <>
              <img
                className="animate-fade h-full w-full object-cover object-[35%_45%]"
                src={`${MEDIA}hero-summit.jpg`}
                onError={() => setImageOk(false)}
                alt=""
                aria-hidden
                decoding="async"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-paper/90 via-paper/55 to-paper/5 lg:from-paper/85 lg:via-paper/40" />
              <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-paper/70 to-transparent" />
            </>
          ) : (
            <GenerativeLandscape />
          )}
        </div>
        <div className="relative grid min-h-[560px] grid-cols-1 content-start gap-6 p-7 pb-0 md:p-12 md:pb-0 lg:min-h-[620px] lg:grid-cols-12">
          <div className="animate-rise lg:col-span-7">
            <div className="mb-5"><Logo variant="nav" className="h-7" /></div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-ink-2 backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-signal" /></span>
              סימולטור אסטרטגיית AI והחזר השקעה · גרסת הרצאה
            </div>
            <h1 className="mt-5 text-[2.6rem] font-black leading-[1.05] text-ink md:text-[3.6rem] lg:text-[4rem]">
              לפני שמתקצבים AI,
              <br />
              כדאי לדעת <span className="relative inline-block text-signal">איפה הכסף<svg className="absolute -bottom-1 left-0 h-2 w-full" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden><path d="M2 6 C 60 1, 140 1, 198 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" /></svg></span>.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
              ארבעה שלבים ממיפוי הזדמנויות ועד תוכנית עם מספרים: קנייה או פיתוח, סימולציית ROI ל-36 חודשים, מדדים וממשל.
              הנוסחאות פתוחות, המקור של כל מספר מסומן, ואין תא ירוק בלי תא אדום לידו.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={onStart}>התחל אבחון <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" /></Button>
              <Button size="lg" variant="secondary" className="bg-paper/80 backdrop-blur" onClick={() => loadPreset('corporations-authority')}>צפה בתרחיש לדוגמה <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /></Button>
            </div>
          </div>

          <div className="lg:col-span-5"><Presenter onStart={onStart} /></div>
        </div>
      </section>

      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map((f, i) => (
          <div key={f.label} style={{ '--i': i + 2 } as React.CSSProperties} className="rounded-2xl border border-line bg-white/70 px-4 py-3">
            <div className="num text-2xl font-semibold text-ink">{f.n}</div>
            <div className="mt-0.5 text-xs text-mute">{f.label}</div>
          </div>
        ))}
      </div>

      <div className="animate-rise grid items-center gap-6 rounded-[var(--radius-card)] border border-line bg-white/60 p-6 md:grid-cols-2 md:p-8">
        <div className="flex justify-center md:justify-start"><Logo variant="hero" /></div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">השיטה</div>
          <h3 className="mt-2 text-2xl font-bold leading-snug">מדאטה לתובנה, מתובנה להחלטה, ומהחלטה לאימפקט</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            ארבע האריחים הם ארבעת שלבי הסימולטור: נתוני הארגון, מפת ההזדמנויות, ההכרעה בין קנייה לפיתוח, והמדידה של מה שבאמת קרה. פותח על ידי אריאל נבו כפרויקט ייחוס להרצאה על בניית אפליקציות עם סוכני קוד.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-xl font-bold">או התחל מתרחיש מוכן</h3>
          <span className="text-xs text-mute">שלושה ארגונים ישראליים, עם נתוני שוק ומגבלות ענן אמיתיות</span>
        </div>
        <div className="stagger grid gap-3 md:grid-cols-3">
          {PRESETS.map((p, i) => {
            const Icon = ICONS[p.icon];
            const art = {
              university: 'from-sky via-lilac to-coral',
              government: 'from-mustard via-coral to-signal',
              law: 'from-sage via-sky to-lilac',
            }[p.icon];
            return (
              <button key={p.id} style={{ '--i': i + 4 } as React.CSSProperties} onClick={() => loadPreset(p.id)} className="group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-white/80 p-5 text-start transition hover:-translate-y-1 hover:border-ink hover:shadow-[0_20px_40px_-24px_rgba(20,22,26,0.45)]">
                <div className={`grain absolute -top-10 left-0 h-28 w-28 rounded-full bg-gradient-to-br opacity-70 blur-xl transition-transform duration-500 group-hover:scale-150 ${art}`} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-paper"><Icon className="h-5 w-5" /></span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-mute">תרחיש {i + 1}</span>
                  </div>
                  <div className="mt-4 text-lg font-bold leading-snug text-ink">{p.title}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-mute">{p.subtitle}</div>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-signal">טען והמשך למפת ההזדמנויות <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
