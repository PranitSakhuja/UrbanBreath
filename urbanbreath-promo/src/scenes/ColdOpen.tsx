import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

const PARTICLES = Array.from({ length: 64 }, (_, i) => ({
  x:     (Math.sin(i * 2.4) * 0.5 + 0.5) * 1920,
  y:     (Math.cos(i * 1.7) * 0.5 + 0.5) * 1080,
  size:  1.5 + (i % 4),
  speed: 0.6 + (i % 5) * 0.18,
  color: i % 3 === 0 ? C.teal : i % 3 === 1 ? C.tealBright : C.cyan,
  delay: (i * 7) % 30,
}));

// Chromatic aberration text layer
const ChromaText = ({
  text, frame, startFrame, fontSize, fontWeight, color, letterSpacing,
}: {
  text: string; frame: number; startFrame: number;
  fontSize: number; fontWeight: number; color: string; letterSpacing: string;
}) => {
  // Offset converges to 0 as text settles
  const offset = interpolate(frame, [startFrame, startFrame + 18], [14, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const chromaOpacity = interpolate(frame, [startFrame, startFrame + 18], [0.8, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const baseOpacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const base: React.CSSProperties = { fontSize, fontWeight, letterSpacing, lineHeight: 1.15, position: 'absolute', whiteSpace: 'nowrap' };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Red channel — left */}
      <span style={{ ...base, color: '#ff4444', opacity: chromaOpacity, transform: `translateX(${-offset}px)`, mixBlendMode: 'screen' }}>{text}</span>
      {/* Blue channel — right */}
      <span style={{ ...base, color: '#4488ff', opacity: chromaOpacity, transform: `translateX(${offset}px)`, mixBlendMode: 'screen' }}>{text}</span>
      {/* Clean text */}
      <span style={{ ...base, color, opacity: baseOpacity, position: 'relative' }}>{text}</span>
    </div>
  );
};

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  
  const { bassIntensity, midIntensity } = useAudio();

  const glowOpacity = interpolate(frame, [20, 60], [0, 0.35], { extrapolateRight: 'clamp' });

  // Slam entrance: scale crashes from 1.5 → overshoots slightly → settles at 1
  const slamScale = interpolate(frame, [15, 22, 32, 38], [1.5, 0.92, 1.04, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Audio reactive
  const audioPulse   = 1 + bassIntensity * 0.07;
  const audioGlow    = bassIntensity * 80;
  const audioSpacing = midIntensity * 2;

  return (
    <AbsoluteFill style={{ background: C.bgVoid, fontFamily: F.sans, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(20,184,166,${glowOpacity}) 0%, transparent 70%)`,
      }} />

      {PARTICLES.map((p, i) => {
        const drift = interpolate(frame, [p.delay, 90 + p.delay], [0, -80 * p.speed]);
        const opacity = interpolate(frame, [p.delay, p.delay + 10, 80, 90], [0, 0.5, 0.4, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{
            position: 'absolute', left: p.x, top: p.y + drift,
            width: p.size, height: p.size, borderRadius: '50%', background: p.color, opacity,
          }} />
        );
      })}

      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          transform: `scale(${slamScale * audioPulse})`,
        }}>
          <div style={{ marginBottom: 4 }}>
            <ChromaText
              text="You take 20,000"
              frame={frame} startFrame={15}
              fontSize={72} fontWeight={900}
              color={C.text1}
              letterSpacing={`${-2 + audioSpacing}px`}
            />
          </div>
          <div>
            <ChromaText
              text="breaths today."
              frame={frame} startFrame={22}
              fontSize={72} fontWeight={900}
              color={C.tealBright}
              letterSpacing={`${-2 + audioSpacing}px`}
            />
          </div>
          {/* Underline that draws in */}
          <div style={{
            height: 3, background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
            marginTop: 12,
            transform: `scaleX(${interpolate(frame, [35, 55], [0, 1], { extrapolateRight: 'clamp' })})`,
            boxShadow: `0 0 ${10 + audioGlow}px ${C.teal}`,
          }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
