interface VisitTagListProps {
  tags?: string[];
  onSelectTag?: (tag: string) => void;
}

export function VisitTagList({ tags, onSelectTag }: VisitTagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="sauna-tag-list">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="sauna-tag sauna-tag-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTag?.(tag);
          }}
          title={`タグ「${tag}」で絞り込み`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
