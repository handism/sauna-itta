import { SaunaVisit, VisitStats } from "../types";

interface ShareModalProps {
  isOpen: boolean;
  stats: VisitStats;
  filteredVisits: SaunaVisit[];
  onClose: () => void;
}

export function ShareModal({ isOpen, stats, filteredVisits, onClose }: ShareModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <div>
            <h2>サウナイッタ シェアビュー</h2>
            <p>この画面をスクリーンショットしてSNSに投稿できます</p>
          </div>
          <button onClick={onClose} className="share-close">
            ✕
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
                  {(visit.status ?? "visited") === "wishlist" && (
                    <span style={{ marginLeft: "0.25rem" }}>🏷 行きたい</span>
                  )}
                  {visit.area && <span style={{ marginLeft: "0.5rem", opacity: 0.8 }}>{visit.area}</span>}
                </div>
                <span>{visit.date}</span>
              </div>
              {(visit.rating ?? 0) > 0 && (
                <div className="share-rating">
                  {"★".repeat(visit.rating ?? 0)}
                  {"☆".repeat(5 - (visit.rating ?? 0))}
                </div>
              )}
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
