import { Dispatch, SetStateAction, memo } from "react";
import { VisitFilters } from "../../types";

const STATUS_OPTIONS: { value: VisitFilters["status"]; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "visited", label: "行った" },
  { value: "wishlist", label: "行きたい" },
];

interface StatusTabsProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
}

function StatusTabsComponent({ filters, setFilters }: StatusTabsProps) {
  return (
    <div className="status-tabs" role="group" aria-label="ステータスフィルター">
      {STATUS_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={filters.status === value}
          className={`status-tab ${filters.status === value ? "is-active" : ""}`}
          onClick={() => setFilters((prev) => ({ ...prev, status: value }))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export const StatusTabs = memo(StatusTabsComponent);
