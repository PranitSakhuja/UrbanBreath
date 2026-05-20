import './index.css';
import { AbsoluteFill, Composition, interpolate, staticFile, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { loadFont } from '@remotion/google-fonts/Inter';
import { AudioProvider } from './AudioContext';

import { ColdOpen }             from './scenes/ColdOpen';
import { TheProblem }           from './scenes/TheProblem';
import { BrandReveal }          from './scenes/BrandReveal';
import { AQIMapScene }          from './scenes/AQIMapScene';
import { LiveLocationScene }    from './scenes/LiveLocationScene';
import { WalkModeScene }        from './scenes/WalkModeScene';
import { ActivityPresetsScene } from './scenes/ActivityPresetsScene';
import { BreathLoadScene }      from './scenes/BreathLoadScene';
import { WalkSummaryScene }     from './scenes/WalkSummaryScene';
import { PollutantScene }       from './scenes/PollutantScene';
import { PrivacyScene }         from './scenes/PrivacyScene';
import { OutroScene }           from './scenes/OutroScene';

loadFont();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENES: [React.FC, number, any, number][] = [
  [ColdOpen,             90,  fade(),                               12],
  [TheProblem,           120, wipe({ direction: 'from-bottom' }),   18],
  [BrandReveal,          105, fade(),                               15],
  [AQIMapScene,          165, fade(),                               10],
  [LiveLocationScene,    120, fade(),                               10],
  [WalkModeScene,        210, slide({ direction: 'from-right' }),   18],
  [ActivityPresetsScene, 120, fade(),                               12],
  [BreathLoadScene,      180, wipe({ direction: 'from-top' }),      15],
  [WalkSummaryScene,     150, slide({ direction: 'from-bottom' }),  20],
  [PollutantScene,       120, fade(),                               12],
  [PrivacyScene,         120, fade(),                               15],
  [OutroScene,           300, fade(),                               20],
];

const TOTAL = SCENES.reduce(
  (acc, [, d], i) => acc + d + (i < SCENES.length - 1 ? SCENES[i][3] : 0),
  0,
);

const UrbanBreathPromo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  const musicVolume = (f: number) =>
    interpolate(
      f,
      [0, 30, durationInFrames - 60, durationInFrames - 1],
      [0, 0.55, 0.55, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

  return (
    // AudioProvider must wrap everything so useCurrentFrame() inside it
    // reads the absolute composition frame, not a Sequence-relative offset
    <AudioProvider>
      <AbsoluteFill>
        <Audio src={staticFile('promo.mp3')} volume={musicVolume} />

        <TransitionSeries>
          {SCENES.map(([Scene, duration, transition, transitionDuration], i) => (
            <>
              <TransitionSeries.Sequence key={`s${i}`} durationInFrames={duration}>
                <Scene />
              </TransitionSeries.Sequence>
              {i < SCENES.length - 1 && (
                <TransitionSeries.Transition
                  key={`t${i}`}
                  presentation={transition}
                  timing={linearTiming({ durationInFrames: transitionDuration })}
                />
              )}
            </>
          ))}
        </TransitionSeries>
      </AbsoluteFill>
    </AudioProvider>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="UrbanBreathPromo"
    component={UrbanBreathPromo}
    durationInFrames={TOTAL}
    fps={30}
    width={1920}
    height={1080}
  />
);
