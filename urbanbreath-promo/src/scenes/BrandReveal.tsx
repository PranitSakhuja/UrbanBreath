import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

const LETTERS = 'UrbanBreath'.split('');

export const BrandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  
  const { bassIntensity, midIntensity } = useAudio();

  const beatScale   = 1 + bassIntensity * 0.06;
  const beatSpacing = midIntensity * 1.5;
  const beatGlow    = 40 + bassIntensity * 60;

  // Logo box: rockets in from scale 0 → overshoots huge → settles
  const logoScale = interpolate(frame, [0, 12, 22, 30], [0, 1.6, 0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  // Icon SVG stroke draw-on
  const iconDash = interpolate(frame, [5, 50], [320, 0], { extrapolateRight: 'clamp' });

  const taglineO = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });
  const glowOpacity = interpolate(frame, [8, 40], [0, 0.4], { extrapolateRight: 'clamp' });

  // Exit: camera rockets INTO the logo
  const exitZoom    = interpolate(frame, [85, 105], [1, 5.5], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const exitOpacity = interpolate(frame, [88, 105], [1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bgVoid, fontFamily: F.sans,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <div style={{ transform: `scale(${exitZoom})`, opacity: exitOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative' }}>

        {/* Glow behind logo */}
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%', top: -80, pointerEvents: 'none',
          background: `radial-gradient(circle, rgba(20,184,166,${glowOpacity}) 0%, transparent 70%)`,
        }} />

        {/* Logo box — rockets in */}
        <div style={{
          width: 96, height: 96, borderRadius: 26, zIndex: 1,
          background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 ${beatGlow}px rgba(20,184,166,${0.4 + bassIntensity * 0.4})`,
          transform: `scale(${logoScale * beatScale})`,
          opacity: logoOpacity,
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
              stroke="#020c1b" strokeWidth="2.5" strokeDasharray={320} strokeDashoffset={iconDash} />
          </svg>
        </div>

        {/* Letters slam in one by one — each from random Y + slight rotation */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          {LETTERS.map((letter, i) => {
            const t  = Math.max(0, frame - 20 - i * 3);
            const ty = interpolate(t, [0, 16], [-80, 0], {
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const rot = interpolate(t, [0, 16], [i % 2 === 0 ? -12 : 12, 0], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const op = interpolate(t, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

            return (
              <span key={i} style={{
                fontSize: 88, fontWeight: 900,
                color: i < 5 ? C.text1 : C.tealBright,     // "Urban" white, "Breath" teal
                display: 'inline-block',
                transform: `translateY(${ty}px) rotate(${rot}deg)`,
                opacity: op,
                letterSpacing: `${-3 + beatSpacing}px`,
                textShadow: `0 0 ${20 + bassIntensity * 50}px rgba(20,184,166,${bassIntensity * 0.5})`,
              }}>
                {letter}
              </span>
            );
          })}
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 18, fontWeight: 500, color: C.teal,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          opacity: taglineO, transform: `translateY(${(1 - taglineO) * 10}px)`,
        }}>
          Air Quality Companion
        </div>
        <div style={{
          fontSize: 22, color: C.text2, opacity: taglineO,
          maxWidth: 560, textAlign: 'center', lineHeight: 1.6,
        }}>
          See what you're breathing. Every walk, every route.
        </div>
      </div>
    </AbsoluteFill>
  );
};
