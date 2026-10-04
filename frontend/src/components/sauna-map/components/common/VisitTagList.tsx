interface VisitTagListProps {
  tags?: string[];
  /** 渡さない場合は表示だけのチップにする（押しても何も起きないボタンを置かない） */
  onSelectTag?: (tag: string) => void;
}

export function VisitTagList({ tags, onSelectTag }: VisitTagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="sauna-tag-list">
      {tags.map((tag) =>
        onSelectTag ? (
          <button
            key={tag}
            type="button"
            className="sauna-tag sauna-tag-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTag(tag);
            }}
            title={`タグ「${tag}」で絞り込み`}
          >
            {tag}
          </button>
        ) : (
          <span key={tag} className="sauna-tag">
            {tag}
          </span>
        ),
      )}
    </div>
  );
}
