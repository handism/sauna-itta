import { useState } from "react";
import { ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { VisitHistoryEntry } from "../types";

interface VisitHistorySectionProps {
  historyCount: number;
  shouldAppend: boolean;
  historyEntries: VisitHistoryEntry[];
  onDeleteEntry?: (index: number) => void;
}

export function VisitHistorySection({
  historyCount,
  shouldAppend,
  historyEntries,
  onDeleteEntry,
}: VisitHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const recentEntries = historyEntries
    .map((entry, index) => ({ entry, index }))
    .reverse()
    .slice(0, 5);

  return (
    <div className="form-group">
      <button
        type="button"
        className="history-section-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="history-section-toggle-label">
          訪問履歴（{historyCount}件）
          {shouldAppend && <span className="history-badge">保存で+1</span>}
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isExpanded && (
        <>
          {historyCount > 0 && (
            <ul className="history-list">
              {recentEntries.map(({ entry, index }) => (
                <li key={`${entry.date}-${index}`} className="history-item">
                  <div className="history-item-header">
                    <span>{entry.date}</span>
                    <span className="history-rating">
                      {entry.rating ? (
                        <>
                          <Star size={11} fill="currentColor" className="rating-star--filled" /> {entry.rating}
                        </>
                      ) : (
                        "評価なし"
                      )}
                    </span>
                    {historyCount > 1 && onDeleteEntry && (
                      <button
                        type="button"
                        className="history-delete-btn"
                        onClick={() => onDeleteEntry(index)}
                        aria-label="この履歴を削除"
                        title="この履歴を削除"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <span className="history-comment">
                    {entry.comment ? entry.comment : "コメントなし"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {historyCount > 5 && (
            <div className="history-more">最新5件のみ表示中</div>
          )}
        </>
      )}
    </div>
  );
}
