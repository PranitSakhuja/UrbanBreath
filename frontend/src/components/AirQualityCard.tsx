import type { AirQualityData } from '../types';
import { aqiGuidance } from '../lib/aqi';
import { Wind } from 'lucide-react';

interface Props {
  data:    AirQualityData | null;
  loading?: boolean;
}

const BAR_REFS = { pm25: 75, pm10: 150, no2: 200, o3: 180, co: 15000 };

/* ── AQI Ring Gauge ──────────────────────────────────────────── */
function AqiRing({ aqi, color }: { aqi: number; color: string }) {
  const R = 48, CX = 60, CY = 60;
  const FULL = 2 * Math.PI * R;
  const ARC  = FULL * 0.75;
  const filled = ARC * Math.min(1, aqi / 300);

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" viewBox="0 0 120 120">
        <defs>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* subtle inner glow fill */}
        <circle cx={CX} cy={CY} r={R - 6} fill={color} fillOpacity="0.04" />
        <g transform={`rotate(135 ${CX} ${CY})`}>
          {/* track */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="rgba(255,255,255,0.14)" strokeWidth="9"
            strokeDasharray={`${ARC} ${FULL}`} strokeLinecap="round" />
          {/* glow behind arc */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke={color} strokeWidth="9" strokeOpacity="0.3"
            strokeDasharray={`${filled} ${FULL}`} strokeLinecap="round"
            filter="url(#ring-glow)" />
          {/* main arc */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={`${filled} ${FULL}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }} />
        </g>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 8,
      }}>
        <span className="mono" style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>
          {Math.round(aqi)}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.12em', marginTop: 5, textTransform: 'uppercase' }}>
          AQI
        </span>
      </div>
    </div>
  );
}

/* ── Smooth bezier trend line ────────────────────────────────── */
function smoothPath(pts: [number, number][]): string {
  return pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
}

/* ── 24h Trend Chart ─────────────────────────────────────────── */
function TrendChart({ values, color }: { values: number[]; color: string }) {
  if (values.length < 4) return null;

  const W = 300, H = 76, PAD_B = 18;
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const range = maxV - minV || 1;
  const gradId = `tg-${color.replace('#', '')}`;

  const pts: [number, number][] = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - PAD_B - ((v - minV) / range) * (H - PAD_B - 4),
  ]);

  const linePath = smoothPath(pts);
  const last = pts[pts.length - 1];

  const gridYs = [0.25, 0.5, 0.75].map(
    t => H - PAD_B - t * (H - PAD_B - 4)
  );

  const labels: { x: number; text: string }[] = [
    { x: 0,   text: `-${values.length - 1}h` },
    { x: W * 0.5, text: `-${Math.round((values.length - 1) / 2)}h` },
    { x: W,   text: 'Now' },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* grid lines */}
      {gridYs.map((y, i) => (
        <line key={i} x1="0" y1={y} x2={W} y2={y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* fill */}
      <path d={`${linePath} L ${W},${H - PAD_B} L 0,${H - PAD_B} Z`}
        fill={`url(#${gradId})`} />

      {/* line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}99)` }} />

      {/* current dot glow */}
      <circle cx={last[0]} cy={last[1]} r="8" fill={color} fillOpacity="0.2" />
      <circle cx={last[0]} cy={last[1]} r="4" fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />

      {/* time labels */}
      {labels.map(({ x, text }, i) => (
        <text key={i} x={x} y={H - 2}
          textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
          fill="var(--text-3)" fontSize="9"
          fontFamily="'JetBrains Mono', monospace">
          {text}
        </text>
      ))}
    </svg>
  );
}

/* ── Mini donut for small pollutants ─────────────────────────── */
function MiniDonut({ value, max, color }: { value: number; max: number; color: string }) {
  const R = 14, CX = 18, CY = 18;
  const FULL = 2 * Math.PI * R;
  const filled = FULL * Math.min(1, value / max);
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${FULL}`} strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
    </svg>
  );
}

/* ── Progress bar ────────────────────────────────────────────── */
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 3,
        background: `linear-gradient(90deg, ${color}99, ${color})`,
        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function AirQualityCard({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="glass slide-up" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 14, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ height: 9, width: '65%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ height: 9, width: '50%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const history = data.aqiHistory ?? [];

  const pollutants = [
    { key: 'pm25', label: 'PM2.5', value: data.pm25, unit: 'µg/m³', color: '#f97316', max: BAR_REFS.pm25,  big: true  },
    { key: 'pm10', label: 'PM10',  value: data.pm10, unit: 'µg/m³', color: '#eab308', max: BAR_REFS.pm10,  big: true  },
    { key: 'no2',  label: 'NO₂',   value: data.no2,  unit: 'µg/m³', color: '#8b5cf6', max: BAR_REFS.no2,   big: false },
    { key: 'o3',   label: 'O₃',    value: data.o3,   unit: 'µg/m³', color: '#22d3ee', max: BAR_REFS.o3,    big: false },
    { key: 'co',   label: 'CO',    value: data.co,   unit: 'µg/m³', color: '#64748b', max: BAR_REFS.co,    big: false },
  ];

  return (
    <div className="glass-teal slide-up" style={{ padding: '16px 18px', overflow: 'hidden', position: 'relative' }}>

      {/* Ambient glow blob */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: `radial-gradient(circle, ${data.color}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* ── Row 1: Ring gauge + AQI info ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <AqiRing aqi={data.aqi} color={data.color} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 13, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
              background: `${data.color}20`, border: `1px solid ${data.color}40`,
              color: data.color,
            }}>
              {data.qualityLabel}
            </span>
            {data.isFallback && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                color: '#fbbf24',
              }}>Demo</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0, marginBottom: 8 }}>
            {aqiGuidance(data.aqi)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)', fontSize: 10 }}>
            <Wind size={10} />
            <span>{data.source === 'open-meteo' ? 'Open-Meteo' : 'Estimated'}</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: PM2.5 + PM10 bars ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {pollutants.filter(p => p.big).map(({ key, label, value, unit, color, max }) => (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                  boxShadow: `0 0 8px ${color}`,
                }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span className="mono" style={{ fontSize: 19, fontWeight: 700, color }}>
                  {value?.toFixed(1) ?? '—'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{unit}</span>
              </div>
            </div>
            <ProgressBar value={value ?? 0} max={max} color={color} />
          </div>
        ))}
      </div>

      {/* ── Row 3: NO₂ · O₃ · CO mini donuts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {pollutants.filter(p => !p.big).map(({ key, label, value, unit, color, max }) => (
          <div key={key} style={{
            background: `${color}0d`,
            border: `1px solid ${color}22`,
            borderRadius: 12, padding: '12px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <MiniDonut value={value ?? 0} max={max} color={color} />
            <p className="mono" style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1, margin: 0 }}>
              {value?.toFixed(1) ?? '—'}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0, letterSpacing: '0.04em' }}>
              {label} · {unit}
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 4: 24h Trend chart ── */}
      {history.length >= 4 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 12,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '0 0 12px 12px',
          margin: '0 -18px -16px',
          padding: '12px 18px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: data.color, boxShadow: `0 0 6px ${data.color}` }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                AQI · Last {history.length}h
              </span>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {Math.round(Math.min(...history))} – {Math.round(Math.max(...history))}
            </span>
          </div>
          <TrendChart values={history} color={data.color} />
        </div>
      )}
    </div>
  );
}
