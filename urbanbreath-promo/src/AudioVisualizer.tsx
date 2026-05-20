import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { C } from './theme';

const MUSIC_SRC = staticFile('promo.mp3');
const BAR_COUNT = 64;

export const AudioVisualizer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: MUSIC_SRC,
    frame,
    fps,
    windowInSeconds: 30,
  });

  // Fade in over first 30 frames, fade out over last 60 frames
  const opacity = interpolate(
    frame,
    [0, 30, durationInFrames - 60, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (!audioData) return null;

  const frequencies = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 256,
    optimizeFor: 'speed',
    dataOffsetInSeconds,
  });

  // Use only the lower 64 bins (bass + mids — most reactive for music)
  const bars = frequencies.slice(0, BAR_COUNT);

  // Bass intensity for the center glow pulse
  const bassIntensity =
    bars.slice(0, 16).reduce((s, v) => s + v, 0) / 16;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 2,
      padding: '0 40px',
      opacity,
      pointerEvents: 'none',
    }}>
      {/* Center radial bass glow */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 180,
        background: `radial-gradient(ellipse 60% 80% at 50% 100%, rgba(20,184,166,${bassIntensity * 0.45}) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Frequency bars */}
      {bars.map((v, i) => {
        // Mirror the bars: first half goes left→center, second half center→right
        const mirrorIdx = i < BAR_COUNT / 2 ? BAR_COUNT / 2 - 1 - i : i - BAR_COUNT / 2;
        const value = bars[mirrorIdx];
        const height = Math.max(3, value * 90);

        // Color transitions from teal (bass) to cyan (highs)
        const t = i / (BAR_COUNT - 1);
        const barColor = t < 0.5 ? C.teal : C.tealBright;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height,
              maxWidth: 8,
              borderRadius: '3px 3px 0 0',
              background: `linear-gradient(to top, ${barColor}, ${C.cyan}88)`,
              boxShadow: value > 0.3 ? `0 0 6px ${barColor}66` : 'none',
              transition: 'height 0.04s linear',
            }}
          />
        );
      })}
    </div>
  );
};
