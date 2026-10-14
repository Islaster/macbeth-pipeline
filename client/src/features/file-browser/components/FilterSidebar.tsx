import type {
  StoredFolder,
  AssetType,
} from "../../../../../shared/types/storedFile";
import type { FileFilters, FileKindFilter } from "../helpers/fileFilters";
import { getSequenceId } from "../helpers/getSequenceId";

interface FilterSidebarProps {
  filters: FileFilters;
  onChange: (filters: FileFilters) => void;
  sequences: StoredFolder[];
  isKindFilterDisabled: boolean;
}

const kindOptions: { value: FileKindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "other", label: "Other" },
];

const assetTypeOptions: { value: AssetType | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "characterSheets", label: "Character sheets" },
  { value: "props", label: "Props" },
];

function optionClass(isActive: boolean): string {
  return `filter-sidebar__option${
    isActive ? " filter-sidebar__option--active" : ""
  }`;
}

function chipClass(isActive: boolean): string {
  return `filter-sidebar__chip${
    isActive ? " filter-sidebar__chip--active" : ""
  }`;
}

export function FilterSidebar({
  filters,
  onChange,
  sequences,
  isKindFilterDisabled,
}: FilterSidebarProps) {
  return (
    <aside className="filter-sidebar">
      <section>
        <h2 className="filter-sidebar__title">File type</h2>
        {kindOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            disabled={isKindFilterDisabled}
            aria-pressed={filters.kind === option.value}
            className={optionClass(filters.kind === option.value)}
            onClick={() => onChange({ ...filters, kind: option.value })}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section>
        <h2 className="filter-sidebar__title">Asset type</h2>
        {assetTypeOptions.map((option) => (
          <button
            type="button"
            key={option.label}
            disabled={isKindFilterDisabled}
            aria-pressed={filters.assetType === option.value}
            className={optionClass(filters.assetType === option.value)}
            onClick={() => onChange({ ...filters, assetType: option.value })}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section>
        <h2 className="filter-sidebar__title">sequence_ids</h2>
        <div className="filter-sidebar__chips">
          <button
            type="button"
            aria-pressed={filters.sequencePath === null}
            className={chipClass(filters.sequencePath === null)}
            onClick={() => onChange({ ...filters, sequencePath: null })}
          >
            All
          </button>
          {sequences.map((sequence) => (
            <button
              type="button"
              key={sequence.path}
              title={sequence.name}
              aria-pressed={filters.sequencePath === sequence.path}
              className={chipClass(filters.sequencePath === sequence.path)}
              onClick={() =>
                onChange({ ...filters, sequencePath: sequence.path })
              }
            >
              {getSequenceId(sequence.name)}
            </button>
          ))}
        </div>
        {sequences.length === 0 && (
          <p className="filter-sidebar__empty">No sequences found.</p>
        )}
      </section>
    </aside>
  );
}
