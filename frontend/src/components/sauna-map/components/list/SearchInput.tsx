import { Dispatch, SetStateAction, memo } from "react";
import { Search, X } from "lucide-react";
import { VisitFilters } from "../../types";

interface SearchInputProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
}

function SearchInputComponent({ filters, setFilters }: SearchInputProps) {
  return (
    <div className="search-row">
      <div className="search-input-wrapper">
        {/* placeholder は支援技術で読み上げられないため、視覚的に隠したラベルを持たせる */}
        <label className="sr-only" htmlFor="visit-list-search">
          サウナ名・エリア・タグで検索
        </label>
        <span className="search-icon" aria-hidden="true"><Search size={15} /></span>
        <input
          id="visit-list-search"
          type="text"
          className="input search-input"
          placeholder="サウナ名・エリア・タグで即検索..."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
        />
        {filters.search && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
            aria-label="検索のクリア"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export const SearchInput = memo(SearchInputComponent);
