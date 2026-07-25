import { useState, useRef, useEffect, useCallback, useId } from "react";
import { Calendar, Star, Flame, ArrowDownAZ, ChevronDown } from "lucide-react";
import { VisitFilters } from "../types";

export interface SortOption {
  value: VisitFilters["sort"];
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "recent", label: "新しい順", Icon: Calendar },
  { value: "oldest", label: "古い順", Icon: Calendar },
  { value: "ratingDesc", label: "評価が高い順", Icon: Star },
  { value: "ratingAsc", label: "評価が低い順", Icon: Star },
  { value: "visitCountDesc", label: "訪問回数が多い順", Icon: Flame },
  { value: "nameAsc", label: "名前順 (あ〜ん)", Icon: ArrowDownAZ },
];

interface SortSelectProps {
  value: VisitFilters["sort"];
  onChange: (value: VisitFilters["sort"]) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className = "" }: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const currentOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];
  const CurrentIcon = currentOption.Icon;

  // Outer click handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keydown handler for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "Enter" || e.key === " ") {
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    },
    [isOpen]
  );

  const handleSelect = (sortValue: VisitFilters["sort"]) => {
    onChange(sortValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`quick-sort-dropdown ${className}`.trim()}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="quick-sort-trigger"
        aria-label="並び順"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        title="並び順"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="quick-sort-trigger-content">
          <CurrentIcon size={14} className="quick-sort-icon" />
          <span>{currentOption.label}</span>
        </span>
        <ChevronDown size={14} className={`quick-sort-chevron ${isOpen ? "is-open" : ""}`} />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          className="quick-sort-menu"
          role="listbox"
          aria-label="並び順を選択"
        >
          {SORT_OPTIONS.map((option) => {
            const OptionIcon = option.Icon;
            const isSelected = option.value === value;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`quick-sort-option ${isSelected ? "is-selected" : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                <OptionIcon size={14} className="quick-sort-icon" />
                <span>{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
