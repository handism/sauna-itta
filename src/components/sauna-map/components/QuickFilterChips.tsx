import { Dispatch, ReactNode, SetStateAction, useMemo } from "react";
import { X, Star, MapPin, Tag } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { getPopularAreas, getPopularTags } from "../utils";

interface QuickFilterChipsProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  visits?: SaunaVisit[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  resultCount?: number;
}

export function QuickFilterChips({
  filters,
  setFilters,
  visits = [],
  activeFilterCount = 0,
  onClearFilters,
}: QuickFilterChipsProps) {
  const popularAreas = useMemo(() => getPopularAreas(visits, 4), [visits]);
  const popularTags = useMemo(() => getPopularTags(visits, 5), [visits]);

  /*
   * チップはどれも「押すと絞り込みが入り、もう一度押すと外れる」同じ振る舞いなので、
   * 種類ごとに JSX とハンドラを複製せず、宣言的に並べて 1 箇所で描画する。
   */
  const chips: { key: string; icon: ReactNode; label: string; isActive: boolean; onToggle: () => void }[] = [
    {
      key: "rating-4",
      icon: <Star size={13} />,
      label: "4.0以上",
      isActive: filters.minRating === 4,
      onToggle: () =>
        setFilters((prev) => ({ ...prev, minRating: prev.minRating === 4 ? 0 : 4 })),
    },
    ...popularAreas.map((area) => ({
      key: `area-${area}`,
      icon: <MapPin size={13} />,
      label: area,
      isActive: filters.selectedArea === area,
      onToggle: () =>
        setFilters((prev) => ({
          ...prev,
          selectedArea: prev.selectedArea === area ? "" : area,
        })),
    })),
    ...popularTags.map((tag) => ({
      key: `tag-${tag}`,
      icon: <Tag size={13} />,
      label: tag,
      isActive: filters.selectedTag === tag,
      onToggle: () =>
        setFilters((prev) => ({
          ...prev,
          selectedTag: prev.selectedTag === tag ? "" : tag,
        })),
    })),
  ];

  const isFilterActive = activeFilterCount > 0;

  // もしサブフィルター（★4以上、エリア、タグ、またはアクティブフィルター）が存在しない場合は非表示にすることも視野に入れるが、スクロールチップバーとしてシンプルに提供
  return (
    <div className="quick-filter-container">
      {chips.length > 3 && (
        <span className="quick-filter-scroll-hint" aria-hidden="true">
          横にスワイプ
        </span>
      )}
      {/* role の無い div の aria-label は支援技術に無視されるため group として公開する */}
      <div className="quick-filter-chips" role="group" aria-label="サブフィルター">
        {/* リセット / アクティブバッジ */}
        {isFilterActive && onClearFilters && (
          <button
            type="button"
            className="chip-btn chip-reset-btn"
            onClick={onClearFilters}
            title="フィルターをクリア"
          >
            <X size={13} /> クリア {activeFilterCount > 0 && <span className="chip-badge">{activeFilterCount}</span>}
          </button>
        )}

        {/* ★4以上 → 人気エリア → 人気タグの順に並ぶ */}
        {chips.map(({ key, icon, label, isActive, onToggle }) => (
          <button
            key={key}
            type="button"
            className={`chip-btn ${isActive ? "is-active" : ""}`}
            aria-pressed={isActive}
            onClick={onToggle}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
