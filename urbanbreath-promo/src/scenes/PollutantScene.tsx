import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';

const POLLUTANTS = [
  { label: 'PM2.5', value: '18.3 μg/m³', color: C.aqiVBad },
  { label: 'PM10',  value: '31.2 μg/m³', color: C.aqiSens },
  { label: 'NO2',   value: '42.1 ppb',   color: C.aqiBad  },
  { label: 'CO',    value: '0.4 ppm',    color: C.aqiMod  },
  { label: 'O₃',    value: '28.7 ppb',   color: C.aqiGood },
];

export const PollutantScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Headline: rocket zoom — comes from far away (big) and slams to size
  const headScale = interpolate(frame, [0, 8, 18, 26], [5, 0.88, 1.06, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const headOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  const subP = interpolate(frame, [50, 68], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const lineS = interpolate(frame, [0, 25], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: C.bgVoid, fontFamily: F.sans,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 52, overflow: 'hidden',
    }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
        <defs>
          <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,37 30,52 2,37 2,17" fill="none" stroke={C.teal} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>

      <div style={{
        position: 'absolute', top: '40%', left: '10%', right: '10%',
        height: 1, background: 'rgba(20,184,166,0.1)',
        transform: `scaleX(${lineS})`, transformOrigin: 'center',
      }} />

      {/* Rocket zoom headline */}
      <div style={{
        fontSize: 64, fontWeight: 900, color: C.text1, letterSpacing: '-2px',
        transform: `scale(${headScale})`, opacity: headOpacity, textAlign: 'center',
      }}>
        5 key pollutants.
      </div>

      {/* Chips: fly in from center, explode to their positions */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {POLLUTANTS.map((p, i) => {
          const t = Math.max(0, frame - 8 - i * 10);
          // Scale: pop in with overshoot
          const chipScale = interpolate(t, [0, 18], [0, 1], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          // Rotates slightly on entrance then straightens
          const chipRot = interpolate(t, [0, 20], [i % 2 === 0 ? 15 : -15, 0], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const float = Math.sin(frame * 0.12 + i * 1.2) * 6;

          return (
            <div key={i} style={{
              borderRadius: 999, padding: '14px 28px',
              background: `${p.color}18`, border: `1px solid ${p.color}55`,
              boxShadow: `0 0 16px ${p.color}22`,
              transform: `scale(${chipScale}) rotate(${chipRot}deg) translateY(${float}px)`,
              opacity: chipScale,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 140,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: p.color }}>{p.label}</div>
              <div style={{ fontSize: 14, color: C.text2, fontFamily: F.mono }}>{p.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        fontSize: 22, color: C.text2, letterSpacing: '0.02em',
        opacity: subP, transform: `translateY(${(1 - subP) * 15}px)`,
      }}>
        Always visible. Always contextual.
      </div>
    </AbsoluteFill>
  );
};
