interface FeelControlProps {
  feel: number;
  onChangeFeel: (nextFeel: number) => void;
}

const FEEL_STOPS = [0, 50, 100] as const;

export function FeelControl({ feel, onChangeFeel }: FeelControlProps) {
  return (
    <section className="panel feel-panel" aria-label="Master feel control">
      <div className="feel-header">
        <div className="feel-title-group">
          <span className="section-title">MASTER FEEL</span>
          <span className="feel-subtitle">
            {feel === 0
              ? 'Dead straight'
              : feel === 100
                ? 'Full stylistic feel'
                : 'Blended pocket'}
          </span>
        </div>
        <span className="feel-value">{feel}%</span>
      </div>

      <input
        type="range"
        className="range-slider feel-slider"
        aria-label="Master Feel percentage"
        min={0}
        max={100}
        step={1}
        value={feel}
        onChange={(e) => onChangeFeel(Number(e.target.value))}
      />

      <div className="feel-stops">
        {FEEL_STOPS.map((stop) => (
          <button
            key={stop}
            type="button"
            className={`feel-stop-btn ${feel === stop ? 'is-active' : ''}`}
            onClick={() => onChangeFeel(stop)}
          >
            {stop === 0 ? '0% Straight' : stop === 50 ? '50% Blend' : '100% Full'}
          </button>
        ))}
      </div>
    </section>
  );
}
