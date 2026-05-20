import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';

const BADGES = ['No account', 'No cloud sync', 'Local only'];

export const PrivacyScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Shield: smash zooms in huge, snaps to normal
  const shieldScale = interpolate(frame, [0, 10, 20, 28], [4.5, 0.85, 1.08, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const shieldOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  const shieldDash = interpolate(frame, [8, 55], [400, 0], { extrapolateRight: 'clamp' });
  const checkDash  = interpolate(frame, [55, 75], [60, 0], { extrapolateRight: 'clamp' });
  const shieldFill = interpolate(frame, [50, 70], [0, 0.08], { extrapolateRight: 'clamp' });

  // "Private by design." — slams in from right
  const title1P = interpolate(frame, [28, 44], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Subtitle: zooms in from tiny
  const title2P = interpolate(frame, [44, 58], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const glowP = Math.sin(frame * 0.06) * 0.1 + 0.35;

  return (
    <AbsoluteFill style={{
      background: '#030609', fontFamily: F.sans,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(20,184,166,${glowP * 0.28}) 0%, transparent 60%)`,
        transform: `scale(${1 + Math.sin(frame * 0.06) * 0.05})`,
      }} />

      {/* Shield: smash zoom */}
      <div style={{ transform: `scale(${shieldScale})`, opacity: shieldOpacity }}>
        <svg width="140" height="165" viewBox="0 0 24 28" fill="none">
          <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={C.teal} strokeWidth="1.5" fill={`rgba(20,184,166,${shieldFill})`}
            strokeDasharray={400} strokeDashoffset={shieldDash}
            strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="9,14 11,16 15,12" stroke={C.tealBright} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={60} strokeDashoffset={checkDash} />
        </svg>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 60, fontWeight: 900, color: C.text1, letterSpacing: '-2px',
          transform: `translateX(${(1 - title1P) * 120}px) scale(${0.8 + title1P * 0.2})`,
          opacity: title1P,
        }}>
          Private by design.
        </div>
        <div style={{
          fontSize: 26, color: C.text2, marginTop: 10,
          transform: `scale(${0.6 + title2P * 0.4})`,
          opacity: title2P,
        }}>
          Your data never leaves your device.
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 14 }}>
        {BADGES.map((b, i) => {
          const t = Math.max(0, frame - 70 - i * 10);
          const badgeP = interpolate(t, [0, 18], [0, 1], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const rot = interpolate(t, [0, 18], [i % 2 === 0 ? -8 : 8, 0], {
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <div key={i} style={{
              background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.28)',
              borderRadius: 999, padding: '10px 24px',
              fontSize: 16, fontWeight: 600, color: C.tealBright,
              transform: `scale(${badgeP}) rotate(${rot}deg)`, opacity: badgeP,
            }}>
              {b}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
