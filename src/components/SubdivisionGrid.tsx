import type { AccentLevel, SubdivisionTuple } from '../types/metronome';

interface SubdivisionGridProps {
  subdivisions: SubdivisionTuple;
  feel: number;
  bpm: number;
  isPlaying: boolean;
  activeSubIndex: number;
  onChangeOffset: (index: number, offsetPercent: number) => void;
  onCycleLevel: (index: number) => void;
}

const LEVEL_META: Record<
  AccentLevel,
  { label: string; bars: number; nextHint: string }
> = {
  mute: { label: 'MUTE', bars: 0, nextHint: 'Soft' },
  soft: { label: 'SOFT', bars: 1, nextHint: 'Normal' },
  normal: { label: 'NORM', bars: 2, nextHint: 'Accent' },
  accent: { label: 'ACNT', bars: 3, nextHint: 'Mute' },
};

export function SubdivisionGrid({
  subdivisions,
  feel,
  bpm,
  isPlaying,
  activeSubIndex,
  onChangeOffset,
  onCycleLevel,
}: SubdivisionGridProps) {
  const sixteenthMs = (60 / bpm / 4) * 1000;

  return (
    <section className="panel subdivisions-panel" aria-label="Micro-timing subdivisions">
      <div className="section-header">
        <span className="section-title">SUBDIVISIONS (1 · e · &amp; · a)</span>
        <span className="section-hint">Tap level · Drag timing</span>
      </div>

      <div className="subdivision-list">
        {subdivisions.map((slot, index) => {
          const meta = LEVEL_META[slot.level];
          const isMuted = slot.level === 'mute';
          const isActive = isPlaying && activeSubIndex === index && !isMuted;
          const effectivePercent = slot.offsetPercent * (feel / 100);
          const effectiveMs = Math.round((effectivePercent / 100) * sixteenthMs);
          const formattedRaw =
            slot.offsetPercent > 0
              ? `+${slot.offsetPercent}%`
              : `${slot.offsetPercent}%`;
          const formattedMs =
            effectiveMs > 0 ? `+${effectiveMs}ms` : `${effectiveMs}ms`;

          return (
            <div
              key={slot.label}
              className={`sub-row ${isMuted ? 'is-muted' : ''} ${
                isActive ? 'is-active' : ''
              }`}
            >
              <div className="sub-row-top">
                <div className="sub-identity">
                  <span
                    className={`sub-badge ${isActive ? 'is-active' : ''} level-${slot.level}`}
                  >
                    {slot.label}
                  </span>

                  <button
                    type="button"
                    className={`level-toggle level-${slot.level}`}
                    onClick={() => onCycleLevel(index)}
                    aria-label={`Subdivision ${slot.label} level ${meta.label}. Tap to set ${meta.nextHint}`}
                  >
                    <span className="level-bars" aria-hidden="true">
                      <span className={`bar ${meta.bars >= 1 ? 'on' : ''}`} />
                      <span className={`bar ${meta.bars >= 2 ? 'on' : ''}`} />
                      <span className={`bar ${meta.bars >= 3 ? 'on' : ''}`} />
                    </span>
                    <span className="level-text">{meta.label}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="offset-readout"
                  onClick={() => onChangeOffset(index, 0)}
                  title="Tap to reset offset to 0%"
                  aria-label={`Offset ${formattedRaw} (${formattedMs}). Tap to reset to 0%`}
                >
                  <span className="offset-pct">{formattedRaw}</span>
                  <span className="offset-ms">{formattedMs}</span>
                </button>
              </div>

              <div className="offset-slider-wrap">
                <span className="offset-bound" aria-hidden="true">
                  -30%
                </span>
                <div className="bipolar-track-container">
                  <span className="center-zero-tick" aria-hidden="true" />
                  <input
                    type="range"
                    className="range-slider offset-slider"
                    aria-label={`Timing offset for ${slot.label}`}
                    min={-30}
                    max={30}
                    step={1}
                    value={slot.offsetPercent}
                    onChange={(e) =>
                      onChangeOffset(index, Number(e.target.value))
                    }
                  />
                </div>
                <span className="offset-bound" aria-hidden="true">
                  +30%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
