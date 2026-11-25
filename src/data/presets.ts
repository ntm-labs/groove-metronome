import type { GroovePreset } from '../types/metronome';

export const PRESETS: GroovePreset[] = [
  {
    id: 'straight',
    name: 'Straight',
    shortName: 'Straight',
    description: 'Dead-even quantized 16th notes with clean downbeat pulse.',
    suggestedBpm: 100,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 0, level: 'soft' },
      { label: '&', offsetPercent: 0, level: 'normal' },
      { label: 'a', offsetPercent: 0, level: 'soft' },
    ],
  },
  {
    id: 'samba',
    name: 'Samba / Balanço',
    shortName: 'Samba',
    description: 'Pushed "e" and "&" with a buoyant, delayed "a" pickup into the beat.',
    suggestedBpm: 96,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: -8, level: 'soft' },
      { label: '&', offsetPercent: -4, level: 'normal' },
      { label: 'a', offsetPercent: 10, level: 'normal' },
    ],
  },
  {
    id: 'jazz-swing',
    name: 'Jazz Swing',
    shortName: 'Jazz Swing',
    description: 'Swung eighth-note ride feel with "e" and "a" muted.',
    suggestedBpm: 132,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 0, level: 'mute' },
      { label: '&', offsetPercent: 16, level: 'normal' },
      { label: 'a', offsetPercent: 0, level: 'mute' },
    ],
  },
  {
    id: 'second-line',
    name: 'New Orleans Second Line',
    shortName: '2nd Line',
    description: 'In-between straight and triplet bounce with a rolling street-beat lilt.',
    suggestedBpm: 94,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 6, level: 'soft' },
      { label: '&', offsetPercent: 10, level: 'normal' },
      { label: 'a', offsetPercent: 14, level: 'normal' },
    ],
  },
  {
    id: 'dilla',
    name: 'Dilla / Unquantized',
    shortName: 'Dilla',
    description: 'Loose, drunk-feel pocket with heavy laid-back offbeats and late pickups.',
    suggestedBpm: 88,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 14, level: 'soft' },
      { label: '&', offsetPercent: 8, level: 'normal' },
      { label: 'a', offsetPercent: 22, level: 'soft' },
    ],
  },
];

export function cloneSubdivisions(preset: GroovePreset) {
  return [
    { ...preset.subdivisions[0] },
    { ...preset.subdivisions[1] },
    { ...preset.subdivisions[2] },
    { ...preset.subdivisions[3] },
  ] as GroovePreset['subdivisions'];
}
