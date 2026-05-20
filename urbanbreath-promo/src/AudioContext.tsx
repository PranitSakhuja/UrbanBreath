import { createContext, useContext } from 'react';
import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type AudioValues = {
  bassIntensity: number;  // 0–1, low frequencies (beat/kick)
  midIntensity: number;   // 0–1, mid frequencies (melody)
  highIntensity: number;  // 0–1, high frequencies (hats/air)
  frequencies: number[];  // raw 64-bin array
};

const EMPTY: AudioValues = {
  bassIntensity: 0,
  midIntensity: 0,
  highIntensity: 0,
  frequencies: new Array(64).fill(0),
};

const AudioCtx = createContext<AudioValues>(EMPTY);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Must be called at root level (outside any Sequence) so frame is absolute
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: staticFile('promo.mp3'),
    frame,
    fps,
    windowInSeconds: 30,
  });

  let values = EMPTY;

  if (audioData) {
    const raw = visualizeAudio({
      fps,
      frame,
      audioData,
      numberOfSamples: 256,
      optimizeFor: 'speed',
      dataOffsetInSeconds,
    });

    const freqs = raw.slice(0, 64);

    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

    values = {
      bassIntensity:  avg(freqs.slice(0, 12)),   // sub-bass + bass
      midIntensity:   avg(freqs.slice(12, 40)),  // low-mid + mid
      highIntensity:  avg(freqs.slice(40, 64)),  // high-mid + presence
      frequencies:    freqs,
    };
  }

  return <AudioCtx.Provider value={values}>{children}</AudioCtx.Provider>;
};

export const useAudio = () => useContext(AudioCtx);
