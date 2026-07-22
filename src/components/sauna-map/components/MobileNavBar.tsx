import Link from "next/link";
import { SheetSnapPosition } from "./BottomSheet";

export type MobileTab = "map" | "list" | "add" | "menu";

interface MobileNavBarProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  snapPosition: SheetSnapPosition;
  onOpenFilter: () => void;
  isFilterActive: boolean;
}

export function MobileNavBar({
  activeTab,
  onSelectTab,
  snapPosition,
  onOpenFilter,
  isFilterActive,
}: MobileNavBarProps) {
  return (
    <nav className="mobile-nav-bar" aria-label="モバイルナビゲーション">
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === "map" && snapPosition === "min" ? "is-active" : ""}`}
        onClick={() => onSelectTab("map")}
      >
        <span className="mobile-nav-icon">🗺️</span>
        <span className="mobile-nav-label">マップ</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${activeTab === "list" && snapPosition !== "min" ? "is-active" : ""}`}
        onClick={() => onSelectTab("list")}
      >
        <span className="mobile-nav-icon">📋</span>
        <span className="mobile-nav-label">一覧</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item mobile-nav-item--add ${activeTab === "add" ? "is-active" : ""}`}
        onClick={() => onSelectTab("add")}
        aria-label="サウナ追加"
      >
        <span className="mobile-nav-icon-add">+</span>
        <span className="mobile-nav-label">追加</span>
      </button>

      <Link
        href="/stats"
        prefetch={false}
        className="mobile-nav-item"
      >
        <span className="mobile-nav-icon">📊</span>
        <span className="mobile-nav-label">統計</span>
      </Link>

      <button
        type="button"
        className={`mobile-nav-item ${isFilterActive ? "has-badge" : ""}`}
        onClick={onOpenFilter}
      >
        <span className="mobile-nav-icon">⚙️</span>
        <span className="mobile-nav-label">絞り込み</span>
      </button>
    </nav>
  );
}
