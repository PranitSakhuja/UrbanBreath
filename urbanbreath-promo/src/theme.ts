import type React from 'react';

export const C = {
  bgVoid:     '#020c1b',
  bgDeep:     '#040f1e',
  bgSurface:  '#071628',
  bgCard:     'rgba(7,22,40,0.82)',
  teal:       '#14b8a6',
  tealBright: '#2dd4bf',
  tealDim:    'rgba(20,184,166,0.12)',
  tealGlow:   'rgba(20,184,166,0.22)',
  cyan:       '#06b6d4',
  border:     'rgba(20,184,166,0.12)',
  borderTeal: 'rgba(20,184,166,0.28)',
  text1:      '#e2e8f0',
  text2:      '#94a3b8',
  text3:      '#475569',
  aqiGood:    '#22c55e',
  aqiMod:     '#eab308',
  aqiSens:    '#f97316',
  aqiBad:     '#ef4444',
  aqiVBad:    '#a855f7',
} as const;

export const F = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const glass: React.CSSProperties = {
  background: 'rgba(7,22,40,0.82)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(20,184,166,0.18)',
  borderRadius: 16,
};

export const glassTeal: React.CSSProperties = {
  ...glass,
  border: '1px solid rgba(20,184,166,0.32)',
  boxShadow: '0 0 24px rgba(20,184,166,0.12)',
};
