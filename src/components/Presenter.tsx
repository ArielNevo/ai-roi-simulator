import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Sparkles, Volume2 } from 'lucide-react';

const MEDIA = `${import.meta.env.BASE_URL}media/`.replace(/\/{2,}/g, '/');

/**
 * Ariel's AI avatar introducing the simulator: a muted looping preview that
 * plays with sound only after a click (browser autoplay policy), with Hebrew
 * captions and an explicit "made with AI" label.
 */
export function Presenter() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(true);
  const [progress, setProgress] = useState(0);
  const [cue, setCue] = useState('');

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
    const onEnd = () => { setPlaying(false); setCue(''); v.muted = true; v.currentTime = 0; v.play().catch(() => undefined); };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnd);
    v.addEventListener('error', () => setReady(false));
    // Captions are read as a live transcript line next to the avatar (the tile is too small for burned-in cues).
    const track = v.textTracks[0];
    const onCue = () => { const c = track?.activeCues?.[0] as VTTCue | undefined; setCue(c?.text ?? ''); };
    if (track) { track.mode = 'hidden'; track.addEventListener('cuechange', onCue); }
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('ended', onEnd); track?.removeEventListener('cuechange', onCue); };
  }, []);

  if (!ready) return null;

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (playing) { v.pause(); v.muted = true; v.loop = true; setPlaying(false); setCue(''); v.play().catch(() => undefined); return; }
    v.loop = false; v.muted = false; v.currentTime = 0;
    v.play().then(() => setPlaying(true)).catch(() => undefined);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/90 p-2.5 pe-4 shadow-sm backdrop-blur">
      <button onClick={toggle} aria-pressed={playing} aria-label={playing ? 'עצור את ההקדמה' : 'הפעל את ההקדמה עם קול'} className="group relative h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl p-[3px] presenter-ring">
        <span className="relative block h-full w-full overflow-hidden rounded-[13px] bg-ink">
          <video ref={ref} className="h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster={`${MEDIA}avatar-poster.jpg`} crossOrigin="anonymous">
            <source src={`${MEDIA}avatar-ariel.mp4`} type="video/mp4" />
            <track kind="captions" srcLang="he" label="עברית" src={`${MEDIA}avatar-ariel.he.vtt`} />
          </video>
          <span className={`absolute inset-0 grid place-items-center bg-ink/30 transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink shadow">{playing ? <Pause className="h-4 w-4" /> : <Play className="ms-0.5 h-4 w-4" />}</span>
          </span>
        </span>
        {playing && <span className="absolute -bottom-1 inset-x-2 h-1 overflow-hidden rounded-full bg-ink/15"><span className="block h-full bg-signal transition-[width]" style={{ width: `${progress * 100}%` }} /></span>}
      </button>
      <div className="min-w-0 text-start">
        <div className="text-sm font-bold leading-tight text-ink">אריאל נבו מציג את הסימולטור</div>
        <div className="mt-0.5 min-h-[2.5rem] text-xs leading-snug text-ink-2" aria-live="polite">{playing ? (cue || 'מנגן עם קול…') : 'לחץ להפעלה עם קול · 20 שניות'}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-mute">
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white/70 px-1.5 py-0.5"><Sparkles className="h-3 w-3" /> אווטאר וקול שנוצרו בבינה מלאכותית</span>
          {!playing && <Volume2 className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}
