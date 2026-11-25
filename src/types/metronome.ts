export type GridMode = '16th' | 'triplet';

export type SubdivisionLabel = '1' | 'e' | '&' | 'a' | 'trip' | 'let';

export type AccentLevel = 'mute' | 'soft' | 'normal' | 'accent';

export interface SubdivisionSlot {
  label: SubdivisionLabel;
  /** Timing offset as a percentage of one subdivision duration (-30 to +30). */
  offsetPercent: number;
  /** Volume / accent level for this subdivision. */
  level: AccentLevel;
}

export interface GroovePreset {
  id: string;
  name: string;
  shortName: string;
  description: string;
  gridMode: GridMode;
  suggestedBpm: number;
  defaultFeel: number;
  subdivisions: SubdivisionSlot[];
}

export interface MetronomeConfig {
  bpm: number;
  /** Master Feel scale from 0 (dead straight) to 100 (full offset). */
  feel: number;
  gridMode: GridMode;
  subdivisions: SubdivisionSlot[];
}

export interface ScheduledStepEvent {
  /** 0..15 (16th mode) or 0..11 (triplet mode) across a 4/4 bar */
  stepIndex: number;
  /** 0..3 quarter-note beat index */
  beatIndex: number;
  /** 0..3 (16th) or 0..2 (triplet) subdivision index within the beat */
  subIndex: number;
  /** Subdivisions per beat (4 for 16th, 3 for triplet) */
  subdivisionsPerBeat: number;
  /** Exact AudioContext time (seconds) when the click plays */
  scheduledTime: number;
  /** Effective offset percent after Master Feel scaling */
  effectiveOffsetPercent: number;
  /** Accent level of this step */
  level: AccentLevel;
}
