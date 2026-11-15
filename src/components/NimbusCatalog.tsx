import { useMemo, useState } from 'react';
import { NIMBUS_AI_SERVICES, NIMBUS_CATEGORY_LABELS, NIMBUS_SOURCE, NIMBUS_TIER1_AI, nimbusStats, type NimbusAiCategory } from '../data/nimbus';
import { Badge, Modal, inputCls } from './ui';

export function NimbusCatalog({ open, onClose, initialQuery = '' }: { open: boolean; onClose: () => void; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState<NimbusAiCategory | 'all'>('all');
  const [platform, setPlatform] = useState<'all' | 'GCP' | 'AWS'>('all');
  const stats = nimbusStats();

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return NIMBUS_AI_SERVICES.filter((s) =>
      (cat === 'all' || s.category === cat) &&
      (platform === 'all' || s.platform === platform) &&
      (!needle || [s.name, s.vendor, s.supplier, s.description].some((f) => f.toLowerCase().includes(needle))),
    );
  }, [q, cat, platform]);

  return (
    <Modal open={open} onClose={onClose} title="קטלוג נימבוס: מה גוף ממשלתי יכול לרכוש">
      <div className="mb-4 rounded-2xl border border-warn/30 bg-warn-soft p-3.5 text-sm text-[#7a4a02]">
        <b>רובד 1</b> = שירותי הענן הנייטיב של GCP ו-AWS בנימבוס (Vertex AI, Document AI, Bedrock…). <b>רובד 5</b> = שירותי צד ג' שאושרו לרכישה בשוק הדיגיטלי.
        המקור: {NIMBUS_SOURCE}. מתוך {stats.total} שירותים ברובד 5, {stats.ai} רלוונטיים ל-AI ולדאטה. הקובץ המקורי נמצא בתיקיית <code>data/</code> של הפרויקט.
      </div>

      <h4 className="mb-2 font-bold">רובד 1: שירותים נייטיב לעבודת AI</h4>
      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        {NIMBUS_TIER1_AI.map((s) => (
          <div key={s.name} className="rounded-2xl border border-line p-3 text-sm">
            <div className="flex items-center gap-2"><Badge tone={s.platform === 'GCP' ? 'blue' : 'amber'}>{s.platform}</Badge><span className="font-semibold">{s.name}</span></div>
            <div className="mt-1 text-xs text-ink-2">{s.useFor}</div>
          </div>
        ))}
      </div>

      <h4 className="mb-2 font-bold">רובד 5: שירותי צד ג' מאושרים (סינון ל-AI ודאטה)</h4>
      <div className="mb-3 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="חיפוש שם, ספק או תיאור…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-xs`} value={cat} onChange={(e) => setCat(e.target.value as NimbusAiCategory | 'all')}>
          <option value="all">כל הקטגוריות</option>
          {(Object.keys(NIMBUS_CATEGORY_LABELS) as NimbusAiCategory[]).filter((k) => k !== 'other').map((k) => <option key={k} value={k}>{NIMBUS_CATEGORY_LABELS[k]} ({stats.byCat[k] ?? 0})</option>)}
        </select>
        <select className={`${inputCls} max-w-40`} value={platform} onChange={(e) => setPlatform(e.target.value as 'all' | 'GCP' | 'AWS')}>
          <option value="all">GCP + AWS</option><option value="GCP">GCP</option><option value="AWS">AWS</option>
        </select>
        <span className="self-center text-sm text-mute">{list.length} תוצאות</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-paper-2/60 text-xs text-ink-2">
            <tr><th className="p-2 text-start">שירות</th><th className="p-2 text-start">יצרן / ספק</th><th className="p-2 text-start">קטגוריה</th><th className="p-2">פלטפורמה</th><th className="p-2">הנחה</th><th className="p-2">מק"ט</th><th className="p-2">אושר</th></tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.sku + s.platform} className="border-t border-line align-top hover:bg-paper-2/60">
                <td className="p-2"><div className="font-semibold">{s.name}</div><div className="text-xs text-mute">{s.description}</div></td>
                <td className="p-2 text-xs">{s.vendor}{s.supplier !== s.vendor && <div className="text-mute">{s.supplier}</div>}</td>
                <td className="p-2 text-xs">{NIMBUS_CATEGORY_LABELS[s.category]}</td>
                <td className="p-2 text-center"><Badge tone={s.platform === 'GCP' ? 'blue' : 'amber'}>{s.platform}</Badge></td>
                <td className="num p-2 text-center text-xs">{s.discountPct != null ? `${s.discountPct}%` : '—'}</td>
                <td className="num p-2 text-center text-xs">{s.sku}</td>
                <td className="num p-2 text-center text-xs">{s.approvedOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
