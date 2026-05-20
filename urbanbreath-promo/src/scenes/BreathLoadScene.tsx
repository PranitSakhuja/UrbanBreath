import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';;
import { C, F } from '../theme';
import { useAudio } from '../AudioContext';

const PARTICLES = Array.from({ length: 80 }, (_, i) => ({
  x:      (Math.sin(i * 1.8) * 0.5 + 0.5) * 1920,
  speed:  0.7 + (i % 6) * 0.15,
  size:   1 + (i % 3),
  color:  i % 2 === 0 ? C.aqiVBad : C.aqiBad,
  offset: (i * 13) % 180,
}));

export const BreathLoadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { bassIntensity } = useAudio();

  const pm25Val  = interpolate(frame, [20, 120], [0, 23.4], { extrapolateRight: 'clamp' });
  const valColor = pm25Val < 8 ? C.aqiGood : pm25Val < 16 ? C.aqiMod : C.aqiSens;

  // Counter: slams DOWN from above — drops fast, squashes on landing, bounces up
  const dropY = interpolate(frame, [20, 33], [-220, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Squash on impact (frame 33): scaleX widens, scaleY squishes, then springs back
  const squashX = interpolate(frame, [33, 36, 42], [1, 1.18, 1.0], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const squashY = interpolate(frame, [33, 36, 42], [1, 0.78, 1.0], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const pillO  = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' });
  const lungO  = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const lungPulse = 1 + Math.sin(frame * 0.1) * 0.03;
  const counterScale = 1 + bassIntensity * 0.08;

  // "Invisible pollution." — slides in from left
  const line1P = interpolate(frame, [30, 48], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // "Made visible." — CRACKS open: top half and bottom half split apart then slam together
  const crackOpen  = interpolate(frame, [50, 62], [1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });   // 1=fully cracked apart, 0=together
  const crackFadeIn = interpolate(frame, [50, 56], [0, 1], { extrapolateRight: 'clamp' });
  const crackOffset = crackOpen * 36;
  const beatNudge   = bassIntensity * 8;

  return (
    <AbsoluteFill style={{ background: '#030609', fontFamily: F.sans, overflow: 'hidden' }}>
      {/* Rising particles */}
      {PARTICLES.map((p, i) => {
        const elapsed = Math.max(0, frame - p.offset);
        const y = 1100 - elapsed * p.speed * 4;
        const opacity = interpolate(y, [0, 600, 1080], [0, 0.55, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{
            position: 'absolute', left: p.x, top: y,
            width: p.size, height: p.size, borderRadius: '50%', background: p.color, opacity,
          }} />
        );
      })}

      {/* Lung silhouette */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${lungPulse})`, opacity: lungO }}>
        <svg width="280" height="320" viewBox="0 0 280 320" fill="none">
          <path d="M140 20 C140 20 80 40 60 100 C40 160 30 200 40 250 C50 290 80 310 110 300 C130 293 140 270 140 270 C140 270 150 293 170 300 C200 310 230 290 240 250 C250 200 240 160 220 100 C200 40 140 20 140 20 Z"
            stroke="rgba(20,184,166,0.4)" strokeWidth="2" fill="rgba(20,184,166,0.05)" />
          <path d="M140 20 C140 60 140 100 140 270" stroke="rgba(20,184,166,0.18)" strokeWidth="1.5" strokeDasharray="4 6" />
        </svg>
      </div>

      {/* Counter — slams down with squash */}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{
          transform: `translateY(${dropY - beatNudge}px) scaleX(${squashX}) scaleY(${squashY}) scale(${counterScale})`,
          fontSize: 90, fontWeight: 900, color: valColor, fontFamily: F.mono, lineHeight: 1,
          textShadow: `0 0 ${40 + bassIntensity * 60}px ${valColor}88`,
        }}>
          {pm25Val.toFixed(1)}
        </div>
        <div style={{ fontSize: 22, color: C.text2 }}>μg PM2.5 inhaled</div>
        <div style={{
          marginTop: 20, background: 'rgba(7,22,40,0.82)', border: '1px solid rgba(20,184,166,0.25)',
          borderRadius: 999, padding: '10px 24px', fontSize: 16, color: C.text2,
          opacity: pillO, backdropFilter: 'blur(10px)',
        }}>
          Based on 22 min walk · Jogging pace
        </div>
      </AbsoluteFill>

      {/* Bottom lines */}
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center' }}>
        {/* Line 1: slides in from left */}
        <div style={{
          fontSize: 52, fontWeight: 300, fontStyle: 'italic', color: C.text2,
          transform: `translateX(${(1 - line1P) * -80}px)`, opacity: line1P,
        }}>
          Invisible pollution.
        </div>

        {/* Line 2: CRACK animation — top & bottom half split then slam together */}
        <div style={{ position: 'relative', height: 68, overflow: 'hidden', marginTop: 4 }}>
          {/* Top half of text */}
          <div style={{
            position: 'absolute', inset: 0,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `translateY(${-crackOffset}px)`,
            opacity: crackFadeIn,
          }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: C.text1, textShadow: `0 0 ${bassIntensity * 50}px rgba(20,184,166,0.6)` }}>
              Made visible.
            </div>
          </div>
          {/* Bottom half of text */}
          <div style={{
            position: 'absolute', inset: 0,
            clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
            transform: `translateY(${crackOffset}px)`,
            opacity: crackFadeIn,
          }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: C.text1, textShadow: `0 0 ${bassIntensity * 50}px rgba(20,184,166,0.6)` }}>
              Made visible.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
