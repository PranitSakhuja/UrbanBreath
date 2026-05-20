import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

const ACTIVITIES = [
  { icon: '🛋️', label: 'Rest',       rate: '7 L/min'  },
  { icon: '🚶', label: 'Walk',       rate: '12 L/min' },
  { icon: '🚶‍♂️', label: 'Brisk Walk', rate: '17 L/min' },
  { icon: '🏃', label: 'Jog',        rate: '25 L/min' },
  { icon: '🏃‍♂️', label: 'Run',        rate: '38 L/min' },
  { icon: '🚴', label: 'Cycling',    rate: '43 L/min' },
];

export const ActivityPresetsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { bassIntensity, midIntensity } = useAudio();

  const beatScale   = 1 + bassIntensity * 0.05;
  const beatSpacing = midIntensity * 2;

  // Headline: zooms in fast from huge, overshoots, settles
  const headScale = interpolate(frame, [0, 10, 20, 28], [4, 0.9, 1.06, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const headOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  const subS = interpolate(frame, [40, 58], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Active card (Jog, i=3) punches forward at frame 60
  const punchP = interpolate(frame, [58, 63, 70], [1, 1.18, 1.0], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const activeP = interpolate(frame, [58, 72], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: C.bgVoid, fontFamily: F.sans,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 48, overflow: 'hidden',
    }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(Math.sin(i * 2.1) * 0.5 + 0.5) * 100}%`,
          top: `${(Math.cos(i * 1.9) * 0.5 + 0.5) * 100}%`,
          width: 2, height: 2, borderRadius: '50%',
          background: C.teal, opacity: 0.15 + (i % 3) * 0.08,
        }} />
      ))}

      {/* Headline: smash zoom in */}
      <div style={{
        fontSize: 60, fontWeight: 900, color: C.text1,
        letterSpacing: `${-2 + beatSpacing}px`,
        transform: `scale(${headScale * beatScale})`,
        opacity: headOpacity,
        textShadow: `0 0 ${bassIntensity * 60}px rgba(20,184,166,${bassIntensity * 0.5})`,
      }}>
        Built for every pace.
      </div>

      {/* Cards: each flips in on Y axis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 160px)', gap: 12 }}>
        {ACTIVITIES.map((a, i) => {
          const t = Math.max(0, frame - i * 9);
          const flip = interpolate(t, [0, 22], [-90, 0], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const op = interpolate(t, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
          const isActive = i === 3;
          const scale = isActive ? punchP * (1 + (activeP) * 0.03) : 1;

          return (
            <div key={i} style={{ perspective: '600px' }}>
              <div style={{
                height: 160, borderRadius: 20,
                background: `rgba(7,22,40,${0.6 + activeP * 0.2 * (isActive ? 1 : 0)})`,
                border: `1px solid ${isActive
                  ? `rgba(20,184,166,${0.15 + activeP * 0.45})`
                  : 'rgba(226,232,240,0.08)'}`,
                boxShadow: isActive ? `0 0 ${activeP * 28}px rgba(20,184,166,${activeP * 0.28})` : 'none',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                transform: `rotateY(${flip}deg) scale(${scale})`,
                opacity: op,
              }}>
                <div style={{ fontSize: 40 }}>{a.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? C.tealBright : C.text1 }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 12, color: C.text3, fontFamily: F.mono }}>{a.rate}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtext */}
      <div style={{
        fontSize: 20, color: C.text2, textAlign: 'center', maxWidth: 700, lineHeight: 1.6,
        opacity: subS, transform: `translateY(${(1 - subS) * 20}px)`,
      }}>
        Breathing rates adjust to your activity — so exposure calculations match your actual intake.
      </div>
    </AbsoluteFill>
  );
};
