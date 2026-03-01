import { SaunaVisit } from "../types";
import { getDirectionsUrl } from "../utils";
import { RatingStars, WishlistChip } from "./common";

interface VisitListProps {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  isFilterActive: boolean;
  onOpenFilters: () => void;
  onEdit: (visit: SaunaVisit) => void;
}

export function VisitList({
  visits,
  filteredVisits,
  isFilterActive,
  onOpenFilters,
  onEdit,
}: VisitListProps) {
  return (
    <div className="sauna-list">
      <h2 className="panel-title mb-2">
        訪れたサウナ ({filteredVisits.length}/{visits.length})
      </h2>
      <button type="button" className="filters-open-btn" onClick={onOpenFilters}>
        <span>フィルター</span>
        <span>{isFilterActive ? `${filteredVisits.length}件` : "すべて表示"}</span>
      </button>

      {visits.length === 0 ? (
        <p className="empty-state">
          まだ投稿がありません。
          <br />
          新しいピンを立ててみましょう！
        </p>
      ) : filteredVisits.length === 0 ? (
        <p className="empty-state">
          条件に合うサウナがありません。
          <br />
          フィルタ条件を見直してみてください。
        </p>
      ) : (
        filteredVisits.map((visit) => (
          <div key={visit.id} className="sauna-card" onClick={() => onEdit(visit)}>
            <h3 className="sauna-card-title">
              {visit.name}
              {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
            </h3>
            {visit.area && <div className="sauna-card-area">{visit.area}</div>}
            <RatingStars rating={visit.rating ?? 0} className="sauna-card-rating" />
            {visit.tags && visit.tags.length > 0 && (
              <div className="sauna-tag-list">
                {visit.tags.map((tag) => (
                  <span key={tag} className="sauna-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="sauna-card-comment">{visit.comment}</p>
            {visit.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={visit.image} className="sauna-img-preview" alt="" />
            )}
            <div className="sauna-card-meta">
              <span>日付: {visit.date}</span>
              {(visit.visitCount ?? 1) > 1 && <span>訪問 {visit.visitCount}回目</span>}
              <span>タップで編集</span>
            </div>
            <a
              href={getDirectionsUrl(visit.lat, visit.lng)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="route-link"
            >
              🧭 ここへ行く
            </a>
          </div>
        ))
      )}
    </div>
  );
}
