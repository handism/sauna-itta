import Link from "next/link";
import { Map, List, Plus, BarChart3 } from "lucide-react";
import type { SheetSnapPosition, MobileTab } from "../types";

export type { MobileTab };

export interface MobileNavBarProps {
  onSelectTab: (tab: MobileTab) => void;
  snapPosition: SheetSnapPosition;
  isAdding: boolean;
}

export function MobileNavBar({
  onSelectTab,
  snapPosition,
  isAdding,
}: MobileNavBarProps) {
  const isMapActive = !isAdding && snapPosition === "min";
  const isListActive = !isAdding && snapPosition !== "min";

  return (
    /*
      ナビには移動先（画面・シート位置）と主役の操作（追加）だけを置く。詳細フィルターは
      一覧の検索欄の横（FilterToggleButton）にあり、ここへ同じ操作を重ねると
      「押すと別の画面へ移る」項目の中にパネルを開くだけの項目が混ざる。
    */
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
