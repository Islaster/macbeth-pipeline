import { viewModeOptions, type ViewMode } from "../helpers/viewMode";

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  onChange: (viewMode: ViewMode) => void;
}

export function ViewModeButtons({ viewMode, onChange }: ViewModeButtonsProps) {
  return (
    <div className="view-mode-buttons" role="group" aria-label="View">
      {viewModeOptions.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={viewMode === option.value}
          className={`view-mode-buttons__option${
            viewMode === option.value
              ? " view-mode-buttons__option--active"
              : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
