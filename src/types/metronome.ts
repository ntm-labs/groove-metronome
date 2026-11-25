export type SubdivisionLabel = '1' | 'e' | '&' | 'a';

export type AccentLevel = 'mute' | 'soft' | 'normal' | 'accent';

export interface SubdivisionSlot {
  label: SubdivisionLabel;
  /** Timing offset as a percentage of one 16th-note duration (-30 to +30). */
  offsetPercent: number;
  /** Volume / accent level for this subdivision. */
  level: AccentLevel;
}

export type SubdivisionTuple = [
  SubdivisionSlot,
  SubdivisionSlot,
  SubdivisionSlot,
  SubdivisionSlot,
];

export interface GroovePreset {
  id: string;
  name: string;
  shortName: string;
  description: string;
  suggestedBpm: number;
  defaultFeel: number;
  subdivisions: SubdivisionTuple;
}

export interface MetronomeConfig {
  bpm: number;
  /** Master Feel scale from 0 (dead straight) to 100 (full offset). */
  feel: number;
  subdivisions: SubdivisionTuple;
}

export interface ScheduledStepEvent {
  /** 0..15 across a 4/4 bar */
  stepIndex: number;
  /** 0..3 quarter-note beat index */
  beatIndex: number;
  /** 0..3 subdivision index (0='1', 1='e', 2='&', 3='a') */
  subIndex: number;
  /** Exact AudioContext time (seconds) when the click plays */
  scheduledTime: number;
  /** Effective offset percent after Master Feel scaling */
  effectiveOffsetPercent: number;
  /** Accent level of this step */
  level: AccentLevel;
}
