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
  // キーボードでハイライト中の項目。フォーカスは listbox 本体に置いたまま
  // aria-activedescendant で位置を公開する（WAI-ARIA の Listbox パターン）
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const currentIndex = SORT_OPTIONS.findIndex((opt) => opt.value === value);
  const currentOption = SORT_OPTIONS[currentIndex] ?? SORT_OPTIONS[0];
  const CurrentIcon = currentOption.Icon;

  // 開いたら listbox 自体にフォーカスを移す。個々の option は
  // フォーカスを持たず、aria-activedescendant で読み上げ位置だけを移動させる
  useEffect(() => {
    if (isOpen) {
      listRef.current?.focus();
    }
  }, [isOpen]);

  const openMenu = useCallback(() => {
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setIsOpen(true);
  }, [currentIndex]);

  /** returnFocus: 外側クリックで閉じる場合はユーザーの操作先を奪わないため false */
  const closeMenu = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  // Outer click handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  const handleSelect = useCallback(
    (sortValue: VisitFilters["sort"]) => {
      onChange(sortValue);
      closeMenu(true);
    },
    [onChange, closeMenu]
  );

  // 閉じている状態のトリガー。Enter / Space はネイティブの click で開くため、
  // ここでは矢印キーによる展開だけを受け持つ
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isOpen) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const lastIndex = SORT_OPTIONS.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev >= lastIndex ? 0 : prev + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? lastIndex : prev - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(lastIndex);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleSelect(SORT_OPTIONS[activeIndex].value);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu(true);
        break;
      case "Tab":
        // 確定せずに閉じる。フォーカスは Tab の既定動作に委ねる
        closeMenu(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`quick-sort-dropdown ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="quick-sort-trigger"
        aria-label="並び順"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        title="並び順"
        onClick={() => (isOpen ? closeMenu(true) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="quick-sort-trigger-content">
          <CurrentIcon size={14} className="quick-sort-icon" />
          <span>{currentOption.label}</span>
        </span>
        <ChevronDown size={14} className={`quick-sort-chevron ${isOpen ? "is-open" : ""}`} />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          className="quick-sort-menu"
          role="listbox"
          aria-label="並び順を選択"
          aria-activedescendant={optionId(activeIndex)}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {SORT_OPTIONS.map((option, index) => {
            const OptionIcon = option.Icon;
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                className={`quick-sort-option ${isSelected ? "is-selected" : ""} ${
                  isActive ? "is-active" : ""
                }`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
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
