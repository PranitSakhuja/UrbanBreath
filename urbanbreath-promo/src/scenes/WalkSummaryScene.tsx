import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';

const STATS = [
  { label: 'Total Time',  value: '24 min',  color: C.teal       },
  { label: 'Distance',    value: '2.1 km',  color: C.tealBright },
  { label: 'Avg AQI',     value: '58',      color: C.aqiMod     },
  { label: 'PM2.5 Dose',  value: '18.3 μg', color: C.aqiSens    },
  { label: 'Worst Point', value: 'AQI 91',  color: C.aqiBad     },
  { label: 'Rating',      value: 'Moderate',color: C.aqiMod     },
];

export const WalkSummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Card: flies up fast then overshoots and settles
  const cardY = interpolate(frame, [0, 22, 32, 40], [700, -30, 15, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const headerP = interpolate(frame, [22, 38], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const divS     = interpolate(frame, [80, 98], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const insightO = interpolate(frame, [92, 110], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bgVoid, fontFamily: F.sans,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(2,12,27,0.4) 0%, rgba(2,12,27,0.97) 40%)',
      }} />

      {/* Card — overshoot bounce up */}
      <div style={{
        width: '80%',
        borderRadius: '28px 28px 0 0',
        background: 'rgba(4,15,30,0.97)',
        border: '1px solid rgba(20,184,166,0.2)',
        borderBottom: 'none',
        padding: '36px 40px 48px',
        transform: `translateY(${cardY}px)`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
          transform: `scale(${0.8 + headerP * 0.2}) translateX(${(1 - headerP) * -20}px)`,
          opacity: headerP,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #5eead4, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#020c1b" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text1 }}>Walk Complete</div>
        </div>

        {/* Stats — each slams in from a random direction */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {STATS.map((s, i) => {
            const t = Math.max(0, frame - 30 - i * 7);
            // Alternate: from left or from right
            const fromX = (i % 2 === 0 ? -1 : 1) * 60;
            const statP = interpolate(t, [0, 18], [0, 1], {
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            return (
              <div key={i} style={{
                background: 'rgba(7,22,40,0.7)',
                border: '1px solid rgba(20,184,166,0.12)',
                borderRadius: 12, padding: '14px 16px',
                transform: `translateX(${(1 - statP) * fromX}px) scale(${0.8 + statP * 0.2})`,
                opacity: statP,
              }}>
                <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: F.mono }}>
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          height: 1, background: 'rgba(20,184,166,0.12)',
          transform: `scaleX(${divS})`, transformOrigin: 'left', marginBottom: 20,
        }} />

        <div style={{
          background: 'rgba(7,22,40,0.6)', border: '1px solid rgba(20,184,166,0.15)',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          opacity: insightO, transform: `translateY(${(1 - insightO) * 12}px)`,
        }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span style={{ fontSize: 16, color: C.text2, lineHeight: 1.6 }}>
            Air quality was moderate. Consider earlier morning walks for cleaner conditions.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
