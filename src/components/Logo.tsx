import type { CSSProperties } from 'react';

/**
 * "Ariel Nevo" wordmark built like periodic-table tiles: Ar · Iel · Ne · vo.
 * Each tile carries one step of the method (Data → Insight → Decision → Impact),
 * and a blue arc links the first two, as in the original brand sketch.
 * Pure SVG + CSS, animates on mount (respects prefers-reduced-motion).
 */

const TILES = [
  { text: 'Ar', word: 'DATA', bg: '#bcdcf7', fg: '#14161a' },
  { text: 'Iel', word: 'INSIGHT', bg: '#cdeedd', fg: '#14161a' },
  { text: 'Ne', word: 'DECISION', bg: '#0f6d62', fg: '#f6f3ec' },
  { text: 'vo', word: 'IMPACT', bg: '#b8651b', fg: '#f6f3ec' },
];

export function Logo({ variant = 'nav', animated = true, className = '' }: { variant?: 'nav' | 'hero'; animated?: boolean; className?: string }) {
  const hero = variant === 'hero';
  const tile = hero ? 96 : 26;
  const gap = hero ? 10 : 3;
  const r = hero ? 20 : 6;
  const width = TILES.length * tile + (TILES.length - 1) * gap;
  const height = hero ? tile + 56 : tile;
  const arcTop = hero ? 0 : 0;
  const yTile = hero ? 34 : 0;
  const anim = animated ? 'logo-animated' : '';
  return (
    <svg
      viewBox={`0 ${arcTop} ${width} ${height}`}
      width={hero ? undefined : width}
      height={hero ? undefined : tile}
      className={`${anim} ${hero ? 'h-auto w-full max-w-[26rem]' : ''} ${className}`}
      role="img"
      aria-label="Ariel Nevo: Data, Insight, Decision, Impact"
      style={{ direction: 'ltr', overflow: 'visible' }}
    >
      {TILES.map((t, i) => {
        const x = i * (tile + gap);
        return (
          <g key={t.text} className="logo-tile" style={{ '--i': i } as CSSProperties}>
            <rect x={x} y={yTile} width={tile} height={tile} rx={r} fill={t.bg} />
            <text
              x={x + tile / 2}
              y={yTile + tile / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={t.fg}
              fontFamily="Heebo, system-ui, sans-serif"
              fontWeight={800}
              fontSize={hero ? 46 : 13}
              letterSpacing={hero ? -1.5 : -0.3}
            >
              {t.text}
            </text>
            {hero && (
              <text x={x + tile / 2} y={yTile + tile + 30} textAnchor="middle" fill="#3b4048" fontFamily="IBM Plex Mono, monospace" fontSize={12} fontWeight={600} letterSpacing={2}>
                {t.word}
              </text>
            )}
          </g>
        );
      })}
      {/* blue arc Ar → Iel, drawn on mount */}
      <path
        className="logo-arc"
        d={`M ${tile * 0.55} ${yTile} C ${tile * 0.75} ${yTile - (hero ? 42 : 11)}, ${tile + gap + tile * 0.25} ${yTile - (hero ? 42 : 11)}, ${tile + gap + tile * 0.45} ${yTile}`}
        fill="none"
        stroke="#2b3cff"
        strokeWidth={hero ? 3 : 1.4}
        strokeLinecap="round"
      />
      <circle className="logo-dot" cx={tile * 0.55} cy={yTile} r={hero ? 4 : 1.6} fill="#2b3cff" />
      <circle className="logo-dot" cx={tile + gap + tile * 0.45} cy={yTile} r={hero ? 4 : 1.6} fill="#2b3cff" style={{ '--i': 1 } as CSSProperties} />
    </svg>
  );
}
