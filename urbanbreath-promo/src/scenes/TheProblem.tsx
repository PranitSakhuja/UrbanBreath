import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

const WORDS = ['But', 'do', 'you', 'know', 'what', "you're", 'breathing?'];
const AQI_STOPS  = [C.aqiGood, C.aqiMod, C.aqiSens, C.aqiBad, C.aqiVBad, '#7f1d1d'];
const AQI_LABELS = ['Good', 'Moderate', 'Sensitive', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];

export const TheProblem: React.FC = () => {
  const frame = useCurrentFrame();
  
  const { bassIntensity } = useAudio();

  // AQI bar scale in
  const barScale = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Smash zoom in on bar at frame 60, then pull back — gives energy
  const barZoom = interpolate(frame, [55, 65, 80, 95], [1, 1.18, 1.18, 1.0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const labelsOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: 'clamp' });
  const vigOpacity    = interpolate(frame, [90, 120], [0, 0.22], { extrapolateRight: 'clamp' });
  const beatNudge     = bassIntensity * 5;

  return (
    <AbsoluteFill style={{ background: C.bgVoid, fontFamily: F.sans, overflow: 'hidden' }}>
      {/* City silhouette */}
      <svg viewBox="0 0 1920 240" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }} preserveAspectRatio="none">
        <path d="M0,240 L0,160 L80,160 L80,120 L120,120 L120,80 L160,80 L160,120 L220,120 L220,60 L260,60 L260,40 L300,40 L300,60 L340,60 L340,100 L400,100 L400,140 L460,140 L460,90 L500,90 L500,50 L540,50 L540,90 L580,90 L580,130 L640,130 L640,70 L680,70 L680,30 L720,30 L720,70 L760,70 L760,110 L820,110 L820,80 L860,80 L860,50 L900,50 L900,80 L940,80 L940,110 L1000,110 L1000,140 L1060,140 L1060,100 L1100,100 L1100,60 L1140,60 L1140,100 L1180,100 L1180,120 L1240,120 L1240,80 L1280,80 L1280,50 L1320,50 L1320,80 L1360,80 L1360,110 L1420,110 L1420,140 L1480,140 L1480,90 L1520,90 L1520,60 L1560,60 L1560,90 L1600,90 L1600,130 L1660,130 L1660,80 L1700,80 L1700,120 L1760,120 L1760,160 L1840,160 L1840,140 L1920,140 L1920,240 Z" fill="#0a1520" />
      </svg>

      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 80%, rgba(239,68,68,${vigOpacity}), transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* AQI bar with zoom pulse */}
      <div style={{
        position: 'absolute', top: '52%', left: '10%', right: '10%',
        transform: `scaleX(${barScale}) scale(${barZoom})`,
        transformOrigin: 'center',
      }}>
        <div style={{
          height: 8, borderRadius: 999,
          background: `linear-gradient(90deg, ${AQI_STOPS.join(', ')})`,
          boxShadow: '0 0 20px rgba(20,184,166,0.2)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, opacity: labelsOpacity }}>
          {AQI_LABELS.map((l, i) => (
            <span key={i} style={{ fontSize: 13, color: AQI_STOPS[i], fontWeight: 600 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Words flip in on X axis — like cards tumbling forward */}
      <div style={{
        position: 'absolute', top: '28%', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
        gap: '0 12px', padding: '0 80px', perspective: '1200px',
      }}>
        {WORDS.map((word, i) => {
          const t = Math.max(0, frame - i * 7);
          const flip = interpolate(t, [0, 20], [90, 0], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const opacity = interpolate(t, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

          // Last word gets a playful overshoot scale
          const lastWordScale = i === WORDS.length - 1
            ? interpolate(t, [18, 25, 32], [1, 1.12, 1.0], {
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              })
            : 1;

          return (
            <span key={i} style={{
              fontSize: 58, fontWeight: 700,
              color: i === WORDS.length - 1 ? C.tealBright : C.text1,
              letterSpacing: '-1px', lineHeight: 1.3,
              display: 'inline-block',
              transform: `perspective(800px) rotateX(${flip}deg) translateY(${i % 2 === 0 ? -beatNudge : beatNudge}px) scale(${lastWordScale})`,
              opacity,
              textShadow: i === WORDS.length - 1
                ? `0 0 ${30 + bassIntensity * 40}px rgba(45,212,191,0.5)` : 'none',
            }}>
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
