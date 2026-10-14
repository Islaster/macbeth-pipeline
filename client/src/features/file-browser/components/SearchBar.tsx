import type { SearchTarget } from "../../../../../shared/types/storedFile";
import type { FileFilters } from "../helpers/fileFilters";

interface SearchBarProps {
  filters: FileFilters;
  onChange: (filters: FileFilters) => void;
  shownCount: number;
  totalCount: number;
  countLabel: string; // "files" or "folders"
}

export function SearchBar({
  filters,
  onChange,
  shownCount,
  totalCount,
  countLabel,
}: SearchBarProps) {
  return (
    <div className="filter-bar">
      <select
        className="filter-bar__target"
        aria-label="What to search for"
        value={filters.searchTarget}
        onChange={(event) =>
          onChange({
            ...filters,
            searchTarget: event.target.value as SearchTarget,
          })
        }
      >
        <option value="files">File names</option>
        <option value="folders">Folder names</option>
      </select>

      <input
        type="search"
        className="filter-bar__search"
        placeholder={
          filters.searchTarget === "files"
            ? "Search file names…"
            : "Search folder names…"
        }
        value={filters.searchText}
        onChange={(event) =>
          onChange({ ...filters, searchText: event.target.value })
        }
      />

      <span className="filter-bar__count">
        {shownCount} of {totalCount} {countLabel}
      </span>
    </div>
  );
}
