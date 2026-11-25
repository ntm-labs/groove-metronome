import { useCallback, useEffect, useRef, useState } from 'react';

interface TempoControlsProps {
  bpm: number;
  onChangeBpm: (nextBpm: number) => void;
  minBpm?: number;
  maxBpm?: number;
}

const TAP_RESET_MS = 2000;
const MAX_TAP_SAMPLES = 6;

export function TempoControls({
  bpm,
  onChangeBpm,
  minBpm = 40,
  maxBpm = 240,
}: TempoControlsProps) {
  const tapTimesRef = useRef<number[]>([]);
  const [tapFlash, setTapFlash] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const clampBpm = useCallback(
    (val: number) => Math.max(minBpm, Math.min(maxBpm, Math.round(val))),
    [minBpm, maxBpm]
  );

  const stopHold = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const startStepHold = (delta: number) => {
    onChangeBpm(clampBpm(bpmRef.current + delta));
    stopHold();
    holdTimerRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(() => {
        onChangeBpm(clampBpm(bpmRef.current + delta));
      }, 65);
    }, 340);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > TAP_RESET_MS) {
      tapTimesRef.current = [now];
    } else {
      taps.push(now);
      if (taps.length > MAX_TAP_SAMPLES) {
        taps.shift();
      }
    }

    setTapFlash(true);
    window.setTimeout(() => setTapFlash(false), 120);

    if (tapTimesRef.current.length >= 2) {
      let totalDelta = 0;
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        totalDelta += tapTimesRef.current[i] - tapTimesRef.current[i - 1];
      }
      const avgMs = totalDelta / (tapTimesRef.current.length - 1);
      if (avgMs > 0) {
        const estimatedBpm = 60000 / avgMs;
        onChangeBpm(clampBpm(estimatedBpm));
      }
    }
  };

  return (
    <section className="panel tempo-panel" aria-label="Tempo controls">
      <div className="tempo-top-row">
        <button
          type="button"
          className="step-btn"
          aria-label="Decrease BPM"
          onPointerDown={() => startStepHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          −
        </button>

        <div className="bpm-readout">
          <span className="bpm-value">{bpm}</span>
          <span className="bpm-unit">BPM</span>
        </div>

        <button
          type="button"
          className="step-btn"
          aria-label="Increase BPM"
          onPointerDown={() => startStepHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          +
        </button>
      </div>

      <div className="tempo-slider-row">
        <input
          type="range"
          className="range-slider tempo-slider"
          aria-label="Tempo BPM"
          min={minBpm}
          max={maxBpm}
          step={1}
          value={bpm}
          onChange={(e) => onChangeBpm(clampBpm(Number(e.target.value)))}
        />
        <button
          type="button"
          className={`tap-btn ${tapFlash ? 'is-flashing' : ''}`}
          onPointerDown={handleTapTempo}
        >
          TAP
        </button>
      </div>
    </section>
  );
}
