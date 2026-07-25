import { Check } from "lucide-react";

const PRESET_TAGS = [
  "外気浴最高",
  "水風呂キンキン",
  "セルフロウリュ",
  "アウフグース",
  "サウナ飯",
  "ソロ向き",
];

interface VisitTagsFieldProps {
  tagsText: string;
  onChange: (tagsText: string) => void;
}

export function VisitTagsField({ tagsText, onChange }: VisitTagsFieldProps) {
  const currentTags = tagsText
    ? tagsText.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

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
      <div className="preset-tags" role="group" aria-label="タグのプリセット">
        {PRESET_TAGS.map((tag) => {
          const isSelected = currentTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`preset-tag-chip ${isSelected ? "is-selected" : ""}`}
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
