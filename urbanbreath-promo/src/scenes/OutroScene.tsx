import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

const AQI_DOTS = [C.aqiGood, C.aqiMod, C.aqiSens, C.aqiBad, C.aqiVBad, '#7f1d1d'];

const PARTICLES = Array.from({ length: 120 }, (_, i) => ({
  x:     (Math.sin(i * 2.4) * 0.5 + 0.5) * 1920,
  y:     (Math.cos(i * 1.7) * 0.5 + 0.5) * 1080,
  speed: 0.5 + (i % 5) * 0.15,
  size:  1 + (i % 4),
  color: i % 3 === 0 ? C.teal : i % 3 === 1 ? C.tealBright : C.cyan,
  delay: (i * 7) % 60,
}));

const LETTERS = 'UrbanBreath'.split('');

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const { bassIntensity, midIntensity } = useAudio();

  const beatScale   = 1 + bassIntensity * 0.06;
  const beatSpacing = midIntensity * 2;
  const beatGlow    = bassIntensity * 80;
  const ctaBeatGlow = 40 + bassIntensity * 60;

  const particleO = interpolate(frame, [0, 60], [0.2, 0.55], { extrapolateRight: 'clamp' });

  // AQI bar draws in
  const barS = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Logo: rockets in from tiny with elastic overshoot
  const iconScale = interpolate(frame, [35, 48, 58, 65], [0, 1.35, 0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const iconOpacity = interpolate(frame, [35, 42], [0, 1], { extrapolateRight: 'clamp' });
  const glow = Math.sin(frame * 0.08) * 0.2 + 0.45;

  // Letters: each slams in, staggered — "UrbanBreath" explodes onto screen
  const taglineO  = interpolate(frame, [100, 118], [0, 1], { extrapolateRight: 'clamp' });

  // CTA: elastic bounce entrance
  const ctaP = interpolate(frame, [128, 145, 155, 162], [0, 1.2, 0.92, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ctaOpacity = interpolate(frame, [128, 138], [0, 1], { extrapolateRight: 'clamp' });

  const urlO = interpolate(frame, [160, 178], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bgVoid, fontFamily: F.sans,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0, overflow: 'hidden',
    }}>
      {/* Particles */}
      {PARTICLES.map((p, i) => {
        const elapsed = Math.max(0, frame - p.delay);
        const drift   = (elapsed * p.speed * 0.6) % 1100;
        return (
          <div key={i} style={{
            position: 'absolute', left: p.x, top: p.y - drift,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.color, opacity: particleO * (0.3 + (i % 4) * 0.1),
          }} />
        );
      })}

      {/* AQI bar */}
      <div style={{ position: 'absolute', top: 100, left: '10%', right: '10%' }}>
        <div style={{
          height: 6, borderRadius: 999,
          background: `linear-gradient(90deg, ${AQI_DOTS.join(', ')})`,
          transform: `scaleX(${barS})`, transformOrigin: 'center', opacity: 0.65,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          {AQI_DOTS.map((c, i) => {
            const s = interpolate(Math.max(0, frame - i * 8), [0, 18], [0, 1], {
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            return (
              <div key={i} style={{
                width: 20, height: 20, borderRadius: '50%', background: c,
                transform: `scale(${s})`, boxShadow: `0 0 10px ${c}66`,
              }} />
            );
          })}
        </div>
      </div>

      {/* Logo — elastic rocket */}
      <div style={{
        width: 100, height: 100, borderRadius: 28,
        background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 ${glow * 80 + beatGlow}px rgba(20,184,166,${glow * 0.5 + bassIntensity * 0.3})`,
        transform: `scale(${iconScale * beatScale})`,
        opacity: iconOpacity, marginBottom: 24,
      }}>
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
            stroke="#020c1b" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Letters slam in — "Urban" from left, "Breath" from right */}
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
        {LETTERS.map((letter, i) => {
          const fromLeft = i < 5;
          const t = Math.max(0, frame - 68 - i * 4);
          const tx = interpolate(t, [0, 20], [fromLeft ? -120 : 120, 0], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const rot = interpolate(t, [0, 20], [fromLeft ? -15 : 15, 0], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const op = interpolate(t, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

          return (
            <span key={i} style={{
              fontSize: 100, fontWeight: 900,
              color: fromLeft ? C.text1 : C.tealBright,
              display: 'inline-block',
              transform: `translateX(${tx}px) rotate(${rot}deg) scale(${beatScale})`,
              opacity: op,
              letterSpacing: `${-3 + beatSpacing}px`,
              textShadow: `0 0 ${20 + bassIntensity * 80}px rgba(20,184,166,${bassIntensity * 0.55})`,
            }}>
              {letter}
            </span>
          );
        })}
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 36, fontWeight: 300, fontStyle: 'italic', color: C.text2,
        opacity: taglineO, transform: `translateY(${(1 - taglineO) * 20}px) scale(${0.8 + taglineO * 0.2})`,
        marginBottom: 48,
      }}>
        Breathe smarter.
      </div>

      {/* CTA — elastic bounce */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(94,234,212,0.15), rgba(56,189,248,0.15))',
        border: '1.5px solid rgba(20,184,166,0.5)', borderRadius: 999,
        padding: '20px 56px', fontSize: 24, fontWeight: 700, color: C.tealBright,
        boxShadow: `0 0 ${ctaBeatGlow}px rgba(20,184,166,${0.15 + bassIntensity * 0.35}), inset 0 0 20px rgba(20,184,166,0.08)`,
        transform: `scale(${ctaP * beatScale})`, opacity: ctaOpacity,
        letterSpacing: '0.02em', marginBottom: 32,
      }}>
        Start for free →
      </div>

      {/* URL */}
      <div style={{
        position: 'absolute', bottom: 40,
        fontSize: 18, color: C.text3, opacity: urlO, letterSpacing: '0.05em',
      }}>
        urbanbreath.app
      </div>
    </AbsoluteFill>
  );
};
