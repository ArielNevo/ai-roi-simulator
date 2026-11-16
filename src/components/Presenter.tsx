import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const MEDIA = `${import.meta.env.BASE_URL}media/`.replace(/\/{2,}/g, '/');

const REPLIES: { q: string; presetId: string }[] = [
  { q: 'איזו יוזמה מחזירה את ההשקעה בתוך שנה?', presetId: 'ariel-nevo-law' },
  { q: 'מה קורה לתקציב אם האימוץ נתקע על 30%?', presetId: 'huji-business-school' },
  { q: 'מה מותר לגוף ממשלתי לרכוש בנימבוס?', presetId: 'corporations-authority' },
];

const GREETING = 'היי, אני אריאל. רוצים שאסביר בדקה איך הסימולטור עובד?';
const OUTRO = 'זהו. בחרו שאלה, או גללו למטה ומלאו את הפרופיל של הארגון שלכם.';

/**
 * Transparent video that works in every browser: the clip is encoded as a
 * vertical stack (colour on top, alpha matte below) in plain H.264, and
 * composited frame by frame onto a canvas. No HEVC/VP9-alpha dependency.
 */
function useStackedAlpha(video: React.RefObject<HTMLVideoElement | null>, canvas: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    const v = video.current, c = canvas.current;
    if (!v || !c || !active) return;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const tmp = document.createElement('canvas');
    const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
    let raf = 0;
    const draw = () => {
      const w = v.videoWidth, h = v.videoHeight / 2;
      if (w && h) {
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; tmp.width = w; tmp.height = h * 2; }
        tctx.drawImage(v, 0, 0);
        const color = tctx.getImageData(0, 0, w, h);
        const mask = tctx.getImageData(0, h, w, h).data;
        const px = color.data;
        for (let i = 0, j = 3; i < mask.length; i += 4, j += 4) px[j] = mask[i];
        ctx.putImageData(color, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [video, canvas, active]);
}

/**
 * A life-size cutout of Ariel's AI avatar that "talks you through" the
 * simulator: idle poster until you ask, then the lip-synced clip with sound,
 * its captions streamed into a speech bubble, and the three demo questions as
 * replies. Fully local media; labelled as AI-generated.
 */
export function Presenter({ onStart }: { onStart?: () => void }) {
  const loadPreset = useAppStore((s) => s.loadPreset);
  const ref = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [cue, setCue] = useState('');
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const track = v.textTracks[0];
    const onCue = () => { const c = track?.activeCues?.[0] as VTTCue | undefined; if (c) setCue(c.text); };
    const onTime = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
    const onEnd = () => { setState('done'); setCue(OUTRO); setProgress(0); };
    const onErr = () => setFailed(true);
    if (track) { track.mode = 'hidden'; track.addEventListener('cuechange', onCue); }
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnd);
    v.addEventListener('error', onErr);
    return () => { track?.removeEventListener('cuechange', onCue); v.removeEventListener('timeupdate', onTime); v.removeEventListener('ended', onEnd); v.removeEventListener('error', onErr); };
  }, []);

  const play = () => {
    const v = ref.current;
    if (!v || failed) return;
    v.muted = false; v.currentTime = 0;
    v.play().then(() => setState('playing')).catch(() => setFailed(true));
  };
  const stop = () => { const v = ref.current; if (!v) return; v.pause(); v.currentTime = 0; setState('idle'); setCue(''); setProgress(0); };

  useStackedAlpha(ref, canvasRef, state === 'playing');

  if (failed) return null;
  const bubble = state === 'idle' ? GREETING : state === 'playing' ? (cue || '…') : OUTRO;

  return (
    <div className="relative flex h-full flex-col justify-end">
      {/* speech bubble */}
      <div className="animate-rise relative z-10 me-auto w-full max-w-[22rem] rounded-[1.4rem] rounded-br-md border border-ink/10 bg-paper/95 p-4 shadow-[0_20px_40px_-24px_rgba(20,22,26,0.5)] backdrop-blur lg:w-[22rem]" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">אריאל נבו</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mute"><Sparkles className="h-3 w-3" /> אווטאר וקול שנוצרו ב-AI</span>
        </div>
        <p className="mt-2 min-h-[3.25rem] text-[15px] font-medium leading-relaxed text-ink">{bubble}</p>
        {state === 'playing' && <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-signal transition-[width] duration-300" style={{ width: `${progress * 100}%` }} /></div>}
        <div className="mt-3 flex flex-wrap gap-2">
          {state === 'idle' && (
            <>
              <button onClick={play} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-paper transition hover:bg-ink-2"><Play className="h-3.5 w-3.5" /> כן, ספר לי</button>
              <button onClick={onStart} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:border-ink">לא, אתחיל לבד</button>
            </>
          )}
          {state === 'playing' && <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink-2 transition hover:border-ink"><Pause className="h-3 w-3" /> עצור</button>}
          {state === 'done' && REPLIES.map((r) => (
            <button key={r.q} onClick={() => loadPreset(r.presetId)} className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-signal hover:text-signal-2">{r.q} <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /></button>
          ))}
          {state === 'done' && <button onClick={play} className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-mute hover:text-ink"><Play className="h-3 w-3" /> שוב</button>}
        </div>
      </div>

      {/* the figure, cut out, standing on the hills */}
      <div className="pointer-events-none relative -mt-3 ms-auto h-[15rem] w-[15rem] sm:h-[17rem] sm:w-[17rem] lg:h-[21rem] lg:w-[21rem]">
        <img src={`${MEDIA}avatar-ariel-poster.png`} alt="" aria-hidden className={`absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300 ${state === 'playing' ? 'opacity-0' : 'animate-breathe opacity-100'}`} />
        <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300 ${state === 'playing' ? 'opacity-100' : 'opacity-0'}`} />
        <video ref={ref} playsInline preload="auto" crossOrigin="anonymous" className="hidden">
          <source src={`${MEDIA}avatar-ariel-stacked.mp4`} type="video/mp4" />
          <track kind="captions" srcLang="he" label="עברית" src={`${MEDIA}avatar-ariel.he.vtt`} />
        </video>
        <div className="absolute inset-x-8 bottom-0 h-3 rounded-[100%] bg-ink/25 blur-md" />
      </div>
    </div>
  );
}
