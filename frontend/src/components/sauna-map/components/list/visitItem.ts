import { Dispatch, SetStateAction } from "react";
import { SaunaVisit, VisitFilters } from "../../types";

/**
 * 訪問リストの 1 行を描画するコンポーネント（`VisitCompactItem` / `VisitCardItem`）の共通 props。
 *
 * 表示密度が違うだけで受け取る情報は同じなので、片方にだけプロパティを足して
 * 比較関数の更新を忘れる事故を防ぐため、型と memo の比較関数をここに集約する。
 */
export interface VisitItemProps {
  visit: SaunaVisit;
  isHovered: boolean;
  isSelected: boolean;
  onHoverVisit?: (id: string | null) => void;
  onSelectVisit?: (visit: SaunaVisit) => void;
  onDeselectVisit?: () => void;
  onEdit: (visit: SaunaVisit) => void;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  onOpenImage: (src: string) => void;
}

/**
 * 再描画が必要なのは「表示中の記録そのもの」か「ホバー／選択状態」が変わったときだけ。
 * コールバック類は毎レンダー新しい関数になり得るため、意図的に比較対象から外している。
 */
export function areVisitItemPropsEqual(
  prevProps: VisitItemProps,
  nextProps: VisitItemProps,
): boolean {
  return (
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.visit === nextProps.visit
  );
}
