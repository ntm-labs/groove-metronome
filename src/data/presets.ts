import type {
  GridMode,
  GroovePreset,
  SubdivisionSlot,
} from '../types/metronome';

export const PRESETS: GroovePreset[] = [
  {
    id: 'straight',
    name: 'Straight',
    shortName: 'Straight',
    description: 'Dead-even quantized 16th notes (25–25–25–25%) with clean downbeat pulse.',
    gridMode: '16th',
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
    description:
      'Slightly late "e" (+6%) with early "&" (−16%) and accented "a" (−24%), stretching the pickup into beat 1 (~31% IOI).',
    gridMode: '16th',
    suggestedBpm: 100,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 6, level: 'normal' },
      { label: '&', offsetPercent: -16, level: 'soft' },
      { label: 'a', offsetPercent: -24, level: 'accent' },
    ],
  },
  {
    id: 'jazz-swing',
    name: 'Jazz Swing (Ride)',
    shortName: 'Jazz Swing',
    description:
      'Triplet-based ride pocket (~2.2:1, 69% upbeat) with middle "trip" muted—unmute "trip" to practice triplet comping.',
    gridMode: 'triplet',
    suggestedBpm: 132,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'trip', offsetPercent: 0, level: 'mute' },
      { label: 'let', offsetPercent: 6, level: 'normal' },
    ],
  },
  {
    id: 'jazz-triplet',
    name: 'Jazz Triplet / Shuffle',
    shortName: 'Triplet',
    description:
      'Full 3-partial triplet grid (2.0:1, 66.7%) for jazz comping, 12/8 grooves, and blues shuffles.',
    gridMode: 'triplet',
    suggestedBpm: 116,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'trip', offsetPercent: 0, level: 'soft' },
      { label: 'let', offsetPercent: 0, level: 'normal' },
    ],
  },
  {
    id: 'second-line',
    name: 'New Orleans Second Line',
    shortName: '2nd Line',
    description:
      '"In-between the cracks" street bounce (~4:3 / 57% offbeat) sitting between straight 16ths and triplets.',
    gridMode: '16th',
    suggestedBpm: 94,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 12, level: 'soft' },
      { label: '&', offsetPercent: 28, level: 'normal' },
      { label: 'a', offsetPercent: 16, level: 'normal' },
    ],
  },
  {
    id: 'dilla',
    name: 'Dilla / Unquantized',
    shortName: 'Dilla',
    description:
      'Nearly-straight hi-hat offbeat (~52.5%) contrasted with a heavily swung, laid-back "a" 16th pickup.',
    gridMode: '16th',
    suggestedBpm: 88,
    defaultFeel: 100,
    subdivisions: [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'e', offsetPercent: 16, level: 'soft' },
      { label: '&', offsetPercent: 10, level: 'normal' },
      { label: 'a', offsetPercent: 24, level: 'normal' },
    ],
  },
];

export function cloneSubdivisions(
  slots: SubdivisionSlot[]
): SubdivisionSlot[] {
  return slots.map((slot) => ({ ...slot }));
}

export function createDefaultSubdivisions(
  gridMode: GridMode
): SubdivisionSlot[] {
  if (gridMode === 'triplet') {
    return [
      { label: '1', offsetPercent: 0, level: 'accent' },
      { label: 'trip', offsetPercent: 0, level: 'soft' },
      { label: 'let', offsetPercent: 0, level: 'normal' },
    ];
  }
  return [
    { label: '1', offsetPercent: 0, level: 'accent' },
    { label: 'e', offsetPercent: 0, level: 'soft' },
    { label: '&', offsetPercent: 0, level: 'normal' },
    { label: 'a', offsetPercent: 0, level: 'soft' },
  ];
}
