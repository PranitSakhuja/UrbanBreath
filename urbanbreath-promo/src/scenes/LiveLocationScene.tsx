import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';

const STREETS_H = [160, 280, 400, 520, 640, 760, 880];
const STREETS_V = [200, 380, 560, 740, 920, 1100, 1280, 1460, 1640, 1820];
const CENTER = { x: 960, y: 520 };

export const LiveLocationScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Smash zoom in on the center location, then pull back to full view
  const zoomIn  = interpolate(frame, [0, 20, 35, 55], [3.5, 3.5, 1.0, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const mapOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Pin: slams down hard
  const pinY   = interpolate(frame, [18, 30], [-280, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Squash on impact
  const pinScaleX = interpolate(frame, [30, 33, 38], [1, 1.3, 1.0], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const pinScaleY = interpolate(frame, [30, 33, 38], [1, 0.7, 1.0], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const pinOpacity = interpolate(frame, [18, 24], [0, 1], { extrapolateRight: 'clamp' });

  const pillP = interpolate(frame, [35, 50], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const cardP = interpolate(frame, [20, 38], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const glowP = Math.sin(frame * 0.15) * 0.075 + 0.4;

  return (
    <AbsoluteFill style={{ background: C.bgVoid, fontFamily: F.sans, overflow: 'hidden' }}>
      {/* Map — zooms in from satellite view */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${zoomIn})`, transformOrigin: `${CENTER.x}px ${CENTER.y}px`,
        opacity: mapOpacity,
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {STREETS_H.map((y, i) => (
            <line key={`h${i}`} x1={0} y1={y} x2={1920} y2={y} stroke="#0d1a2a" strokeWidth={i % 2 === 0 ? 2 : 1} />
          ))}
          {STREETS_V.map((x, i) => (
            <line key={`v${i}`} x1={x} y1={0} x2={x} y2={1080} stroke="#0d1a2a" strokeWidth={i % 3 === 0 ? 2 : 1} />
          ))}
        </svg>
      </div>

      {/* Glow halo */}
      <div style={{
        position: 'absolute', left: CENTER.x - 100, top: CENTER.y - 100 + pinY,
        width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(20,184,166,${glowP * 0.4}) 0%, transparent 70%)`,
        transform: `scale(${1 + Math.sin(frame * 0.15) * 0.08})`,
      }} />

      {/* Ripple rings */}
      {[0, 20, 40].map((delay, i) => {
        const t = Math.max(0, frame - 32 - delay);
        const scale   = interpolate(t, [0, 80], [0.2, 2.5], { extrapolateRight: 'clamp' });
        const opacity = interpolate(t, [0, 80], [0.7, 0], { extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{
            position: 'absolute', left: CENTER.x - 50, top: CENTER.y - 50 + pinY,
            width: 100, height: 100, borderRadius: '50%',
            border: `2px solid ${C.teal}`,
            transform: `scale(${scale})`, opacity,
          }} />
        );
      })}

      {/* Pin — slams down with squash */}
      <div style={{
        position: 'absolute', left: CENTER.x - 18, top: CENTER.y - 44 + pinY,
        opacity: pinOpacity,
        transform: `scaleX(${pinScaleX}) scaleY(${pinScaleY})`,
        transformOrigin: 'bottom center',
      }}>
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill={C.teal} />
          <circle cx="18" cy="18" r="8" fill="#020c1b" />
          <circle cx="18" cy="18" r="4" fill={C.tealBright} />
        </svg>
      </div>

      {/* AQI pill */}
      <div style={{
        position: 'absolute', left: CENTER.x + 28, top: CENTER.y - 56 + pinY,
        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)',
        borderRadius: 999, padding: '7px 16px',
        display: 'flex', alignItems: 'center', gap: 6,
        transform: `scale(${pillP}) rotate(${(1 - pillP) * 10}deg)`,
        transformOrigin: 'left center', opacity: pillP,
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.aqiGood, fontFamily: F.mono }}>AQI 42</span>
        <span style={{ fontSize: 14, color: C.aqiGood }}>· Good</span>
      </div>

      {/* Feature card */}
      <div style={{
        position: 'absolute', bottom: 60, left: 60,
        background: 'rgba(7,22,40,0.82)', backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(20,184,166,0.28)',
        borderRadius: 16, padding: '20px 28px',
        display: 'flex', alignItems: 'center', gap: 16,
        transform: `translateY(${(1 - cardP) * 60}px) scale(${0.9 + cardP * 0.1})`,
        opacity: cardP, boxShadow: '0 0 24px rgba(20,184,166,0.12)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: C.tealDim, border: `1px solid ${C.borderTeal}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" /><path d="M12 16v6M8 20h8" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text1 }}>Live Location Awareness</div>
          <div style={{ fontSize: 15, color: C.text2, marginTop: 3 }}>Centered on where you actually are</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
