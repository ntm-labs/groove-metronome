import type { SubdivisionTuple } from '../types/metronome';

interface BeatVisualizerProps {
  isPlaying: boolean;
  activeStep: number | null;
  subdivisions: SubdivisionTuple;
  feel: number;
}

const BEATS = [0, 1, 2, 3] as const;
const SUBS = [0, 1, 2, 3] as const;

export function BeatVisualizer({
  isPlaying,
  activeStep,
  subdivisions,
  feel,
}: BeatVisualizerProps) {
  const activeBeat = activeStep !== null ? Math.floor(activeStep / 4) : -1;
  const activeSub = activeStep !== null ? activeStep % 4 : -1;

  return (
    <section className="panel visualizer-panel" aria-label="Beat and groove visualizer">
      {/* 4-Beat / 16th-Note Bar Indicator */}
      <div className="beat-grid" role="status" aria-live="off">
        {BEATS.map((beatIdx) => {
          const isCurrentBeat = isPlaying && activeBeat === beatIdx;
          const isDownbeat = beatIdx === 0;
          return (
            <div
              key={beatIdx}
              className={`beat-cell ${isCurrentBeat ? 'is-active' : ''} ${
                isDownbeat ? 'is-downbeat' : ''
              }`}
            >
              <span className="beat-number">{beatIdx + 1}</span>
              <div className="sub-dots" aria-hidden="true">
                {SUBS.map((subIdx) => {
                  const stepIdx = beatIdx * 4 + subIdx;
                  const slot = subdivisions[subIdx];
                  const isStepActive = isPlaying && activeStep === stepIdx;
                  return (
                    <span
                      key={subIdx}
                      className={`sub-dot level-${slot.level} ${
                        isStepActive ? 'is-active' : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Micro-Timing Pocket Strip (1 beat = 4 subdivisions) */}
      <div className="pocket-strip" aria-label="Micro-timing offset preview">
        <div className="pocket-header">
          <span className="pocket-label">POCKET GRID</span>
          <span className="pocket-legend">
            <span className="legend-dot quantized" /> straight
            <span className="legend-dot shifted" /> feel
          </span>
        </div>
        <div className="pocket-track">
          {subdivisions.map((slot, idx) => {
            const basePos = idx * 25 + 6; // 6%, 31%, 56%, 81%
            const effectiveOffset = slot.offsetPercent * (feel / 100);
            // 1 subdivision width = 25% of beat; ±30% of a 16th = ±7.5% of beat
            const shiftedPos = basePos + (effectiveOffset / 100) * 25;
            const isMuted = slot.level === 'mute';
            const isLit = isPlaying && activeSub === idx && !isMuted;

            return (
              <div key={slot.label} className="pocket-slot-group">
                {/* Quantized straight reference tick */}
                <span
                  className="pocket-grid-line"
                  style={{ left: `${basePos}%` }}
                  aria-hidden="true"
                />
                {/* Shifted micro-timed marker */}
                <span
                  className={`pocket-marker level-${slot.level} ${
                    isLit ? 'is-active' : ''
                  }`}
                  style={{ left: `${shiftedPos}%` }}
                  title={`${slot.label}: ${effectiveOffset >= 0 ? '+' : ''}${Math.round(effectiveOffset)}%`}
                >
                  <span className="pocket-marker-label">{slot.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
