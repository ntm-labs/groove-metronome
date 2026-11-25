import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MetronomeEngine } from './audio/MetronomeEngine';
import { BeatVisualizer } from './components/BeatVisualizer';
import { FeelControl } from './components/FeelControl';
import { PresetSelector } from './components/PresetSelector';
import { SubdivisionGrid } from './components/SubdivisionGrid';
import { TempoControls } from './components/TempoControls';
import { cloneSubdivisions, PRESETS } from './data/presets';
import type {
  AccentLevel,
  GroovePreset,
  SubdivisionTuple,
} from './types/metronome';

const LEVEL_CYCLE: AccentLevel[] = ['mute', 'soft', 'normal', 'accent'];

const INITIAL_PRESET = PRESETS[1]; // Samba / Balanço

export function App() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    INITIAL_PRESET.id
  );
  const [bpm, setBpm] = useState<number>(INITIAL_PRESET.suggestedBpm);
  const [feel, setFeel] = useState<number>(INITIAL_PRESET.defaultFeel);
  const [subdivisions, setSubdivisions] = useState<SubdivisionTuple>(() =>
    cloneSubdivisions(INITIAL_PRESET)
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const rafRef = useRef<number | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new MetronomeEngine({
        bpm,
        feel,
        subdivisions,
      });
    }
    return engineRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push live parameter updates into the lookahead scheduler without interrupting playback
  useEffect(() => {
    engineRef.current?.updateConfig({ bpm, feel, subdivisions });
  }, [bpm, feel, subdivisions]);

  // Clean up audio engine and animation loop on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      engineRef.current?.dispose();
    };
  }, []);

  // Audio-synced visual polling loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tickVisuals = () => {
      const latest = engineRef.current?.consumeLatestVisualEvent();
      if (latest) {
        setActiveStep(latest.stepIndex);
      }
      rafRef.current = window.requestAnimationFrame(tickVisuals);
    };

    rafRef.current = window.requestAnimationFrame(tickVisuals);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  const handleTogglePlay = useCallback(() => {
    const engine = getEngine();
    if (engine.getIsRunning()) {
      engine.stop();
      setIsPlaying(false);
      setActiveStep(null);
    } else {
      // Unlock & start synchronously inside the user tap gesture for iOS Safari
      engine.updateConfig({ bpm, feel, subdivisions });
      engine.start();
      setIsPlaying(true);
    }
  }, [bpm, feel, subdivisions, getEngine]);

  // Spacebar play/stop convenience on desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLButtonElement)
      ) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlay]);

  const handleSelectPreset = (preset: GroovePreset) => {
    setSelectedPresetId(preset.id);
    setSubdivisions(cloneSubdivisions(preset));
    setFeel(preset.defaultFeel);
    setBpm(preset.suggestedBpm);
  };

  const handleResetPreset = () => {
    const preset =
      PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0];
    setSubdivisions(cloneSubdivisions(preset));
    setFeel(preset.defaultFeel);
  };

  const handleChangeOffset = (index: number, offsetPercent: number) => {
    const clamped = Math.max(-30, Math.min(30, Math.round(offsetPercent)));
    setSubdivisions((prev) => {
      const next = [
        { ...prev[0] },
        { ...prev[1] },
        { ...prev[2] },
        { ...prev[3] },
      ] as SubdivisionTuple;
      next[index].offsetPercent = clamped;
      return next;
    });
  };

  const handleCycleLevel = (index: number) => {
    setSubdivisions((prev) => {
      const next = [
        { ...prev[0] },
        { ...prev[1] },
        { ...prev[2] },
        { ...prev[3] },
      ] as SubdivisionTuple;
      const currentIdx = LEVEL_CYCLE.indexOf(next[index].level);
      next[index].level = LEVEL_CYCLE[(currentIdx + 1) % LEVEL_CYCLE.length];
      return next;
    });
  };

  const isModified = useMemo(() => {
    const preset = PRESETS.find((p) => p.id === selectedPresetId);
    if (!preset) return false;
    return preset.subdivisions.some(
      (slot, idx) =>
        slot.offsetPercent !== subdivisions[idx].offsetPercent ||
        slot.level !== subdivisions[idx].level
    );
  }, [selectedPresetId, subdivisions]);

  const activeSubIndex = activeStep !== null ? activeStep % 4 : -1;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true" />
          <h1 className="brand-title">GROOVE</h1>
          <span className="time-sig-badge">4/4</span>
        </div>
        <span className="engine-badge">
          {isPlaying ? 'LOCKED · WEB AUDIO' : 'MICRO-TIMING'}
        </span>
      </header>

      <main className="app-main">
        <BeatVisualizer
          isPlaying={isPlaying}
          activeStep={activeStep}
          subdivisions={subdivisions}
          feel={feel}
        />

        <TempoControls bpm={bpm} onChangeBpm={setBpm} />

        <PresetSelector
          presets={PRESETS}
          selectedPresetId={selectedPresetId}
          isModified={isModified}
          onSelectPreset={handleSelectPreset}
          onResetPreset={handleResetPreset}
        />

        <FeelControl feel={feel} onChangeFeel={setFeel} />

        <SubdivisionGrid
          subdivisions={subdivisions}
          feel={feel}
          bpm={bpm}
          isPlaying={isPlaying}
          activeSubIndex={activeSubIndex}
          onChangeOffset={handleChangeOffset}
          onCycleLevel={handleCycleLevel}
        />
      </main>

      <footer className="transport-dock">
        <button
          type="button"
          className={`play-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={handleTogglePlay}
          aria-pressed={isPlaying}
        >
          <span className="play-icon" aria-hidden="true">
            {isPlaying ? '■' : '▶'}
          </span>
          <span>{isPlaying ? 'STOP' : 'PLAY'}</span>
        </button>
      </footer>
    </div>
  );
}

export default App;
