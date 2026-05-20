import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const ROUTE: [number, number][] = [
  [30,140],[55,120],[80,135],[110,110],[140,125],[170,100],
  [200,115],[230,90],[260,105],[290,80],[320,95],[350,75],
  [380,90],[400,70],[420,80],[440,60],[460,75],[480,55],[500,65],
];
const PATH_D = `M ${ROUTE.map(([x, y]) => `${x},${y}`).join(' L ')}`;

export const WalkModeScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const { bassIntensity } = useAudio();

  // Phone 3D flip entrance on Y axis — like a card being flipped toward the camera
  const phoneFlip = interpolate(frame, [0, 28], [-90, 0], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const phoneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // Copy text: each line zooms in from a distance
  const copy1P = interpolate(frame, [15, 35], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const copy2P = interpolate(frame, [28, 45], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const copy3P = interpolate(frame, [40, 58], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const elapsed   = Math.floor(interpolate(frame, [0, 210], [0, 754]));
  const distance  = interpolate(frame, [0, 210], [0, 1.24]).toFixed(2);
  const aqiNow    = Math.round(interpolate(frame, [0, 60, 90, 150, 210], [48, 55, 52, 61, 58]));
  const pm25      = interpolate(frame, [0, 210], [0, 18.3]).toFixed(1);
  const routeP    = interpolate(frame, [80, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dashOff   = 500 * (1 - routeP);
  const routeIdx  = Math.max(0, Math.min(Math.floor(routeP * (ROUTE.length - 1)), ROUTE.length - 1));
  const [dotX, dotY] = ROUTE[routeIdx] ?? ROUTE[0];

  const METRICS = [
    { label: 'Distance', value: `${distance}`, unit: 'km',       color: C.teal       },
    { label: 'AQI Now',  value: `${aqiNow}`,   unit: 'Moderate', color: C.aqiMod     },
    { label: 'PM2.5',    value: `${pm25}`,      unit: 'μg/m³',   color: C.aqiSens    },
    { label: 'Avg AQI',  value: '54',           unit: 'avg',      color: C.tealBright },
  ];

  return (
    <AbsoluteFill style={{ background: C.bgVoid, fontFamily: F.sans, display: 'flex', alignItems: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 50% 60% at 72% 50%, rgba(20,184,166,0.05) 0%, transparent 70%)`,
      }} />

      {/* Left copy — each line zooms from small to normal */}
      <div style={{ flex: 1, paddingLeft: 100, zIndex: 10 }}>
        <div style={{
          fontSize: 64, fontWeight: 900, color: C.text1, letterSpacing: '-2px', lineHeight: 1.1,
          transform: `scale(${interpolate(copy1P, [0, 1], [0.5, 1])}) translateX(${(1 - copy1P) * -60}px)`,
          opacity: copy1P,
        }}>Walk Mode</div>
        <div style={{
          fontSize: 28, color: C.text2, marginTop: 14,
          transform: `translateX(${(1 - copy2P) * -40}px)`,
          opacity: copy2P,
        }}>Track your exposure</div>
        <div style={{
          fontSize: 28, fontWeight: 700, color: C.tealBright,
          transform: `scale(${interpolate(copy3P, [0, 1], [0.8, 1])}) translateX(${(1 - copy3P) * -30}px)`,
          opacity: copy3P,
          textShadow: `0 0 ${bassIntensity * 40}px rgba(45,212,191,0.6)`,
        }}>in real time.</div>
      </div>

      {/* Phone — 3D Y flip */}
      <div style={{ perspective: '1400px', marginRight: 120 }}>
        <div style={{
          width: 340, height: 680,
          borderRadius: 36,
          background: '#07111f',
          border: '1.5px solid rgba(20,184,166,0.25)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(20,184,166,0.1)',
          overflow: 'hidden',
          transform: `rotateY(${phoneFlip}deg)`,
          opacity: phoneOpacity,
          display: 'flex', flexDirection: 'column', padding: 20, gap: 14,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text1 }}>Walk Mode</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 999, padding: '4px 10px',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', transform: `scale(${1 + Math.sin(frame * 0.2) * 0.3})` }} />
              <span style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {/* Timer */}
          <div style={{ fontSize: 52, fontWeight: 800, color: C.text1, fontFamily: F.mono, lineHeight: 1 }}>
            {fmtTime(elapsed)}
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {METRICS.map((m, i) => {
              // Each tile slides up from bottom staggered
              const tileP = interpolate(frame, [20 + i * 8, 38 + i * 8], [0, 1], {
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              return (
                <div key={i} style={{
                  background: 'rgba(7,22,40,0.9)', border: '1px solid rgba(20,184,166,0.15)',
                  borderRadius: 12, padding: '10px 12px',
                  transform: `translateY(${(1 - tileP) * 30}px)`, opacity: tileP,
                }}>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.text1, fontFamily: F.mono, marginTop: 4 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{m.unit}</div>
                </div>
              );
            })}
          </div>

          {/* Route map */}
          <div style={{ flex: 1, background: '#040e1c', border: '1px solid rgba(20,184,166,0.12)', borderRadius: 12, overflow: 'hidden', padding: 10 }}>
            <svg width="100%" height="100%" viewBox="0 0 540 160" preserveAspectRatio="xMidYMid meet">
              <path d={PATH_D} fill="none" stroke="rgba(20,184,166,0.15)" strokeWidth="3" strokeLinecap="round" />
              <path d={PATH_D} fill="none" stroke={C.tealBright} strokeWidth="3" strokeLinecap="round" strokeDasharray={500} strokeDashoffset={dashOff} />
              {routeP > 0 && (<>
                <circle cx={dotX} cy={dotY} r="8" fill={C.teal} fillOpacity="0.3" />
                <circle cx={dotX} cy={dotY} r="4" fill={C.tealBright} />
              </>)}
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
