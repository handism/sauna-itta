import { X } from "lucide-react";
import { SaunaVisit, VisitStats } from "../types";
import { RatingStars, WishlistChip } from "./common";
import { useModalBehavior } from "../hooks/useModalBehavior";

interface ShareModalProps {
  isOpen: boolean;
  stats: VisitStats;
  filteredVisits: SaunaVisit[];
  onClose: () => void;
}

export function ShareModal({ isOpen, stats, filteredVisits, onClose }: ShareModalProps) {
  const containerRef = useModalBehavior(isOpen, onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="share-overlay" onClick={onClose} role="presentation">
      <div
        ref={containerRef}
        className="share-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        aria-describedby="share-modal-desc"
        tabIndex={-1}
      >
        <div className="share-header">
          <div>
            <h2 id="share-modal-title">サウナイッタ シェアビュー</h2>
            <p id="share-modal-desc">この画面をスクリーンショットしてSNSに投稿できます</p>
          </div>
          <button type="button" onClick={onClose} className="share-close" aria-label="閉じる">
            <X size={18} />
          </button>
        </div>
        <div className="share-summary">
          {stats.firstDate && stats.lastDate && (
            <div>
              記録期間: <strong>{stats.firstDate}</strong> 〜 <strong>{stats.lastDate}</strong>
            </div>
          )}
          {stats.avgRating > 0 && (
            <div>
              平均満足度: <strong>{stats.avgRating}</strong> / 5
            </div>
          )}
        </div>
        <div className="share-list">
          {filteredVisits.slice(0, 30).map((visit) => (
            <div key={visit.id} className="share-item">
              <div className="share-item-top">
                <div>
                  <strong>{visit.name}</strong>
                  {(visit.status ?? "visited") === "wishlist" && <WishlistChip compact />}
                  {visit.area && <span className="share-area">{visit.area}</span>}
                </div>
                <span>{visit.date}</span>
              </div>
              <RatingStars rating={visit.rating ?? 0} className="share-rating" />
              {visit.tags && visit.tags.length > 0 && (
                <div className="share-tags">
                  {visit.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
              {visit.comment && <div className="share-comment">{visit.comment}</div>}
            </div>
          ))}
          {filteredVisits.length > 30 && (
            <div className="share-more">ほか {filteredVisits.length - 30} 件…</div>
          )}
        </div>
      </div>
    </div>
  );
}
