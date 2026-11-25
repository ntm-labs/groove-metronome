import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MetronomeEngine } from './audio/MetronomeEngine';
import { BeatVisualizer } from './components/BeatVisualizer';
import { FeelControl } from './components/FeelControl';
import { PresetSelector } from './components/PresetSelector';
import { SubdivisionGrid } from './components/SubdivisionGrid';
import { TempoControls } from './components/TempoControls';
import {
  cloneSubdivisions,
  createDefaultSubdivisions,
  PRESETS,
} from './data/presets';
import type {
  AccentLevel,
  GridMode,
  GroovePreset,
  SubdivisionSlot,
} from './types/metronome';

const LEVEL_CYCLE: AccentLevel[] = ['mute', 'soft', 'normal', 'accent'];

const INITIAL_PRESET = PRESETS[1]; // Samba / Balanço

export function App() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    INITIAL_PRESET.id
  );
  const [gridMode, setGridMode] = useState<GridMode>(INITIAL_PRESET.gridMode);
  const [bpm, setBpm] = useState<number>(INITIAL_PRESET.suggestedBpm);
  const [feel, setFeel] = useState<number>(INITIAL_PRESET.defaultFeel);
  const [subdivisions, setSubdivisions] = useState<SubdivisionSlot[]>(() =>
    cloneSubdivisions(INITIAL_PRESET.subdivisions)
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
        gridMode,
        subdivisions,
      });
    }
    return engineRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push live parameter updates into the lookahead scheduler without interrupting playback
  useEffect(() => {
    engineRef.current?.updateConfig({ bpm, feel, gridMode, subdivisions });
  }, [bpm, feel, gridMode, subdivisions]);

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
      engine.updateConfig({ bpm, feel, gridMode, subdivisions });
      engine.start();
      setIsPlaying(true);
    }
  }, [bpm, feel, gridMode, subdivisions, getEngine]);

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
    setGridMode(preset.gridMode);
    setSubdivisions(cloneSubdivisions(preset.subdivisions));
    setFeel(preset.defaultFeel);
    setBpm(preset.suggestedBpm);
    if (preset.gridMode !== gridMode) {
      setActiveStep(null);
    }
  };

  const handleResetPreset = () => {
    const preset =
      PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0];
    setGridMode(preset.gridMode);
    setSubdivisions(cloneSubdivisions(preset.subdivisions));
    setFeel(preset.defaultFeel);
    if (preset.gridMode !== gridMode) {
      setActiveStep(null);
    }
  };

  const handleChangeGridMode = (nextMode: GridMode) => {
    if (nextMode === gridMode) return;
    setGridMode(nextMode);
    setSubdivisions(createDefaultSubdivisions(nextMode));
    setActiveStep(null);
  };

  const handleChangeOffset = (index: number, offsetPercent: number) => {
    const clamped = Math.max(-30, Math.min(30, Math.round(offsetPercent)));
    setSubdivisions((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, offsetPercent: clamped } : slot
      )
    );
  };

  const handleCycleLevel = (index: number) => {
    setSubdivisions((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        const currentIdx = LEVEL_CYCLE.indexOf(slot.level);
        return {
          ...slot,
          level: LEVEL_CYCLE[(currentIdx + 1) % LEVEL_CYCLE.length],
        };
      })
    );
  };

  const isModified = useMemo(() => {
    const preset = PRESETS.find((p) => p.id === selectedPresetId);
    if (!preset) return false;
    if (preset.gridMode !== gridMode) return true;
    if (preset.subdivisions.length !== subdivisions.length) return true;
    return preset.subdivisions.some(
      (slot, idx) =>
        slot.offsetPercent !== subdivisions[idx].offsetPercent ||
        slot.level !== subdivisions[idx].level
    );
  }, [selectedPresetId, gridMode, subdivisions]);

  const subsPerBeat = gridMode === 'triplet' ? 3 : 4;
  const activeSubIndex = activeStep !== null ? activeStep % subsPerBeat : -1;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true" />
          <h1 className="brand-title">GROOVE</h1>
          <span className="time-sig-badge">
            4/4 · {gridMode === 'triplet' ? 'TRIPLET' : '16TH'}
          </span>
        </div>
        <span className="engine-badge">
          {isPlaying ? 'LOCKED · WEB AUDIO' : 'MICRO-TIMING'}
        </span>
      </header>

      <main className="app-main">
        <BeatVisualizer
          isPlaying={isPlaying}
          activeStep={activeStep}
          gridMode={gridMode}
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
          gridMode={gridMode}
          subdivisions={subdivisions}
          feel={feel}
          bpm={bpm}
          isPlaying={isPlaying}
          activeSubIndex={activeSubIndex}
          onChangeGridMode={handleChangeGridMode}
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
