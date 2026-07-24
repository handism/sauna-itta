import Link from "next/link";
import { Map, List, Plus, BarChart3, SlidersHorizontal } from "lucide-react";
import type { SheetSnapPosition, MobileTab } from "../types";

export type { MobileTab };

export interface MobileNavBarProps {
  onSelectTab: (tab: MobileTab) => void;
  snapPosition: SheetSnapPosition;
  isAdding: boolean;
  onOpenFilter: () => void;
  isFilterActive: boolean;
}

export function MobileNavBar({
  onSelectTab,
  snapPosition,
  isAdding,
  onOpenFilter,
  isFilterActive,
}: MobileNavBarProps) {
  const isMapActive = !isAdding && snapPosition === "min";
  const isListActive = !isAdding && snapPosition !== "min";

  return (
    <nav className="mobile-nav-bar" aria-label="モバイルナビゲーション">
      <button
        type="button"
        className={`mobile-nav-item ${isMapActive ? "is-active" : ""}`}
        onClick={() => onSelectTab("map")}
      >
        <span className="mobile-nav-icon"><Map size={19} /></span>
        <span className="mobile-nav-label">マップ</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isListActive ? "is-active" : ""}`}
        onClick={() => onSelectTab("list")}
      >
        <span className="mobile-nav-icon"><List size={19} /></span>
        <span className="mobile-nav-label">一覧</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item mobile-nav-item--add ${isAdding ? "is-active" : ""}`}
        onClick={() => onSelectTab("add")}
        aria-label="サウナ追加"
      >
        <span className="mobile-nav-icon mobile-nav-icon--add"><Plus size={22} /></span>
        <span className="mobile-nav-label">追加</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isFilterActive ? "is-active" : ""}`}
        onClick={onOpenFilter}
      >
        <span className="mobile-nav-icon">
          <SlidersHorizontal size={19} />
          {isFilterActive && <span className="filter-active-dot" />}
        </span>
        <span className="mobile-nav-label">フィルター</span>
      </button>

      <Link
        href="/stats"
        prefetch={false}
        className="mobile-nav-item"
      >
        <span className="mobile-nav-icon"><BarChart3 size={19} /></span>
        <span className="mobile-nav-label">統計</span>
      </Link>
    </nav>
  );
}
