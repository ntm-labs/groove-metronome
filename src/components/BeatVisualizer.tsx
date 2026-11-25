import type { GridMode, SubdivisionSlot } from '../types/metronome';

interface BeatVisualizerProps {
  isPlaying: boolean;
  activeStep: number | null;
  gridMode: GridMode;
  subdivisions: SubdivisionSlot[];
  feel: number;
}

const BEATS = [0, 1, 2, 3] as const;

export function BeatVisualizer({
  isPlaying,
  activeStep,
  gridMode,
  subdivisions,
  feel,
}: BeatVisualizerProps) {
  const subsPerBeat = gridMode === 'triplet' ? 3 : 4;
  const activeBeat =
    activeStep !== null ? Math.floor(activeStep / subsPerBeat) : -1;
  const activeSub = activeStep !== null ? activeStep % subsPerBeat : -1;

  // Compute live swing ratio for the primary upbeat ("let" in triplet mode, "&" in 16th mode)
  const upbeatIndex = 2;
  const upbeatSlot = subdivisions[upbeatIndex];
  const stepSpanPct = 100 / subsPerBeat;
  const upbeatBasePct = upbeatIndex * stepSpanPct;
  const upbeatEffectiveOffset = upbeatSlot
    ? upbeatSlot.offsetPercent * (feel / 100)
    : 0;
  const upbeatBeatPct =
    upbeatBasePct + (upbeatEffectiveOffset / 100) * stepSpanPct;
  const swingRatio =
    upbeatBeatPct > 0 && upbeatBeatPct < 100
      ? upbeatBeatPct / (100 - upbeatBeatPct)
      : 1;

  const pocketStatusText =
    gridMode === 'triplet'
      ? `SWING ${swingRatio.toFixed(1)}:1 · ${Math.round(upbeatBeatPct)}%`
      : Math.abs(upbeatEffectiveOffset) >= 1
        ? `& @ ${Math.round(upbeatBeatPct)}% (${swingRatio.toFixed(2)}:1)`
        : '16TH POCKET GRID';

  return (
    <section
      className="panel visualizer-panel"
      aria-label="Beat and groove visualizer"
    >
      {/* 4-Beat / Subdivision Bar Indicator */}
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
                {subdivisions.map((slot, subIdx) => {
                  const stepIdx = beatIdx * subsPerBeat + subIdx;
                  const isStepActive = isPlaying && activeStep === stepIdx;
                  return (
                    <span
                      key={slot.label}
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

      {/* Live Micro-Timing Pocket Strip (1 beat = 3 or 4 subdivisions) */}
      <div className="pocket-strip" aria-label="Micro-timing offset preview">
        <div className="pocket-header">
          <span className="pocket-label">{pocketStatusText}</span>
          <span className="pocket-legend">
            <span className="legend-dot quantized" /> grid
            <span className="legend-dot shifted" /> feel
          </span>
        </div>
        <div className="pocket-track">
          {subdivisions.map((slot, idx) => {
            const baseBeatPct = idx * stepSpanPct;
            const effectiveOffset = slot.offsetPercent * (feel / 100);
            const shiftedBeatPct =
              baseBeatPct + (effectiveOffset / 100) * stepSpanPct;

            // Map 0..100% of beat onto 7%..93% of track width so markers stay comfortably inside bounds
            const baseLeft = 7 + baseBeatPct * 0.86;
            const shiftedLeft = 7 + shiftedBeatPct * 0.86;

            const isMuted = slot.level === 'mute';
            const isLit = isPlaying && activeSub === idx && !isMuted;

            return (
              <div key={slot.label} className="pocket-slot-group">
                <span
                  className="pocket-grid-line"
                  style={{ left: `${baseLeft}%` }}
                  aria-hidden="true"
                />
                <span
                  className={`pocket-marker ${
                    slot.label.length > 1 ? 'is-wide' : ''
                  } level-${slot.level} ${isLit ? 'is-active' : ''}`}
                  style={{ left: `${shiftedLeft}%` }}
                  title={`${slot.label}: ${Math.round(shiftedBeatPct)}% of beat`}
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
