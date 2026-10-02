import Link from "next/link";
import { Map, List, Plus, BarChart3, SlidersHorizontal } from "lucide-react";
import type { SheetSnapPosition, MobileTab } from "../types";

export type { MobileTab };

export interface MobileNavBarProps {
  onSelectTab: (tab: MobileTab) => void;
  snapPosition: SheetSnapPosition;
  isAdding: boolean;
  /** 詳細フィルターの開閉。押すたびに開閉が切り替わる */
  onOpenFilter: () => void;
  isFilterPanelOpen: boolean;
  isFilterActive: boolean;
}

export function MobileNavBar({
  onSelectTab,
  snapPosition,
  isAdding,
  onOpenFilter,
  isFilterPanelOpen,
  isFilterActive,
}: MobileNavBarProps) {
  const isMapActive = !isAdding && snapPosition === "min";
  const isListActive = !isAdding && snapPosition !== "min";

  return (
    <nav className="mobile-nav-bar" aria-label="モバイルナビゲーション">
      <button
        type="button"
        className={`mobile-nav-item ${isMapActive ? "is-active" : ""}`}
        aria-current={isMapActive ? "true" : undefined}
        onClick={() => onSelectTab("map")}
      >
        <span className="mobile-nav-icon"><Map size={19} /></span>
        <span className="mobile-nav-label">マップ</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isListActive ? "is-active" : ""}`}
        aria-current={isListActive ? "true" : undefined}
        onClick={() => onSelectTab("list")}
      >
        <span className="mobile-nav-icon"><List size={19} /></span>
        <span className="mobile-nav-label">一覧</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item mobile-nav-item--add ${isAdding ? "is-active" : ""}`}
        aria-current={isAdding ? "true" : undefined}
        onClick={() => onSelectTab("add")}
        aria-label="サウナ追加"
      >
        <span className="mobile-nav-icon mobile-nav-icon--add"><Plus size={22} /></span>
        <span className="mobile-nav-label">追加</span>
      </button>

      {/*
        パネルの開閉ボタンなので状態は aria-expanded で公開する（デスクトップの
        FilterToggleButton と同じ）。aria-pressed にすると「絞り込みのオン／オフ」を
        切り替えるトグルとして読み上げられ、押した結果と食い違う。
        絞り込み中であることはドットの見た目に加えて、読み上げ用の補足で伝える。
      */}
      <button
        type="button"
        className={`mobile-nav-item ${isFilterPanelOpen || isFilterActive ? "is-active" : ""}`}
        aria-expanded={isFilterPanelOpen}
        onClick={onOpenFilter}
      >
        <span className="mobile-nav-icon">
          <SlidersHorizontal size={19} />
          {isFilterActive && <span className="filter-active-dot" aria-hidden="true" />}
        </span>
        <span className="mobile-nav-label">
          フィルター
          {isFilterActive && <span className="sr-only">（絞り込み中）</span>}
        </span>
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
