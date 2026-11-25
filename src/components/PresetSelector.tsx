import type { GroovePreset } from '../types/metronome';

interface PresetSelectorProps {
  presets: GroovePreset[];
  selectedPresetId: string;
  isModified: boolean;
  onSelectPreset: (preset: GroovePreset) => void;
  onResetPreset: () => void;
}

export function PresetSelector({
  presets,
  selectedPresetId,
  isModified,
  onSelectPreset,
  onResetPreset,
}: PresetSelectorProps) {
  const activePreset =
    presets.find((p) => p.id === selectedPresetId) ?? presets[0];

  return (
    <section className="panel preset-panel" aria-label="Groove presets">
      <div className="section-header">
        <span className="section-title">GROOVE PRESET</span>
        {isModified && (
          <button
            type="button"
            className="reset-pill"
            onClick={onResetPreset}
            aria-label={`Reset ${activePreset.name} preset`}
          >
            Modified · Reset
          </button>
        )}
      </div>

      <div className="preset-strip" role="tablist" aria-label="Groove presets">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`preset-pill ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectPreset(preset)}
            >
              {preset.shortName}
            </button>
          );
        })}
      </div>

      <p className="preset-description">
        <strong>{activePreset.name}:</strong> {activePreset.description}
      </p>
    </section>
  );
}
