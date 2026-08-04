import { Dispatch, ReactNode, SetStateAction, useMemo } from "react";
import { X, Star, MapPin, Tag, Search, SlidersHorizontal } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../../types";
import { getPopularAreas, getPopularTags } from "../../utils";

interface QuickFilterChipsProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  visits?: SaunaVisit[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  resultCount?: number;
}

interface ChipItem {
  key: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onToggle: () => void;
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
   * 検索やステータス、マップ範囲内絞り込みなど、
   * 通常のクイックフィルター候補に含まれない有効なフィルター条件を個別チップとして集約する。
   */
  const activeExtraChips: ChipItem[] = useMemo(() => {
    const extra: ChipItem[] = [];

    if (filters.search.trim().length > 0) {
      extra.push({
        key: "active-search",
        icon: <Search size={13} />,
        label: `検索: "${filters.search}"`,
        isActive: true,
        onToggle: () => setFilters((prev) => ({ ...prev, search: "" })),
      });
    }

    if (filters.status !== "all") {
      extra.push({
        key: "active-status",
        icon: <SlidersHorizontal size={13} />,
        label: `ステータス: ${filters.status === "visited" ? "行った" : "行きたい"}`,
        isActive: true,
        onToggle: () => setFilters((prev) => ({ ...prev, status: "all" })),
      });
    }

    if (filters.minRating > 0 && filters.minRating !== 4) {
      extra.push({
        key: "active-rating-custom",
        icon: <Star size={13} />,
        label: `★ ${filters.minRating}.0以上`,
        isActive: true,
        onToggle: () => setFilters((prev) => ({ ...prev, minRating: 0 })),
      });
    }

    if (filters.selectedArea && !popularAreas.includes(filters.selectedArea)) {
      extra.push({
        key: "active-area-custom",
        icon: <MapPin size={13} />,
        label: `エリア: ${filters.selectedArea}`,
        isActive: true,
        onToggle: () => setFilters((prev) => ({ ...prev, selectedArea: "" })),
      });
    }

    if (filters.selectedTag && !popularTags.includes(filters.selectedTag)) {
      extra.push({
        key: "active-tag-custom",
        icon: <Tag size={13} />,
        label: `タグ: ${filters.selectedTag}`,
        isActive: true,
        onToggle: () => setFilters((prev) => ({ ...prev, selectedTag: "" })),
      });
    }

    if (filters.filterByBounds) {
      extra.push({
        key: "active-bounds",
        icon: <MapPin size={13} />,
        label: "エリア内のみ",
        isActive: true,
        onToggle: () => setFilters((prev) => ({ ...prev, filterByBounds: false })),
      });
    }

    return extra;
  }, [filters, popularAreas, popularTags, setFilters]);

  /*
   * プリセットのクイックフィルター候補。
   * どれも「押すと絞り込みが入り、もう一度押すと外れる」同じ振る舞い。
   */
  const presetChips: ChipItem[] = [
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
  const allChips = [...activeExtraChips, ...presetChips];

  return (
    <div className="quick-filter-container">
      {allChips.length > 3 && (
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

        {/* アクティブな特別チップ → ★4以上 → 人気エリア → 人気タグの順に並ぶ */}
        {allChips.map(({ key, icon, label, isActive, onToggle }) => (
          <button
            key={key}
            type="button"
            className={`chip-btn ${isActive ? "is-active active-filter-chip" : ""}`}
            aria-pressed={isActive}
            onClick={onToggle}
          >
            {icon} <span>{label}</span>
            {isActive && <X size={12} className="chip-remove-icon" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}

