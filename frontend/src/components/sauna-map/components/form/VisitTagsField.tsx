import { Check } from "lucide-react";
import { toNormalizedTags } from "../../utils";
import { cx } from "../../utils/classNames";

interface VisitTagsFieldProps {
  tagsText: string;
  onChange: (tagsText: string) => void;
  /** 候補のチップ。よく使うタグ順（`getTagSuggestions()`）で渡す */
  suggestedTags: readonly string[];
}

export function VisitTagsField({ tagsText, onChange, suggestedTags }: VisitTagsFieldProps) {
  const currentTags = toNormalizedTags(tagsText);

  const toggleTag = (preset: string) => {
    const exists = currentTags.includes(preset);
    const updated = exists
      ? currentTags.filter((t) => t !== preset)
      : [...currentTags, preset];
    onChange(updated.join(", "));
  };

  return (
    <div className="form-group">
      <label htmlFor="visit-tags">タグ（カンマ区切り）</label>
      <input
        id="visit-tags"
        className="input"
        value={tagsText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: 外気浴最高, 水風呂キンキン, ソロ向き"
      />
      <div className="preset-tags" role="group" aria-label="タグの候補">
        {suggestedTags.map((tag) => {
          const isSelected = currentTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={cx("preset-tag-chip", isSelected && "is-selected")}
              aria-pressed={isSelected}
              onClick={() => toggleTag(tag)}
            >
              {isSelected ? <Check size={12} /> : "+"} {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
