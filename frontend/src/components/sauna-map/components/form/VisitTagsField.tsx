import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";
import { TAG_SEPARATOR_PATTERN, toNormalizedTags } from "../../utils";
import { cx } from "../../utils/classNames";

interface VisitTagsFieldProps {
  tagsText: string;
  onChange: (tagsText: string) => void;
  /** 候補のチップ。よく使うタグ順（`getTagSuggestions()`）で渡す */
  suggestedTags: readonly string[];
}

const HINT_ID = "visit-tags-hint";

/**
 * タグはチップとして並べ、入力欄には次の 1 件だけを打つ。
 * カンマ区切りの 1 行テキストだと、日本語入力中に全角の「、」を打って 1 つのタグに
 * まとまったり、長くなると何個付いているのか読めなかったりするため。
 * フォームの値は従来どおりカンマ区切りの文字列（`tagsText`）で持つ。
 */
export function VisitTagsField({ tagsText, onChange, suggestedTags }: VisitTagsFieldProps) {
  const currentTags = toNormalizedTags(tagsText);
  // 確定前の 1 件。確定するまでフォームの値へ入れない（入れるとチップとして表示されてしまう）
  const [draft, setDraft] = useState("");

  const updateTags = (tags: string[]) => {
    onChange(toNormalizedTags(tags.join(",")).join(", "));
  };

  const commit = (text: string) => {
    if (toNormalizedTags(text).length > 0) {
      updateTags([...currentTags, text]);
    }
  };

  const toggleTag = (preset: string) => {
    const exists = currentTags.includes(preset);
    updateTags(exists ? currentTags.filter((t) => t !== preset) : [...currentTags, preset]);
  };

  const removeTag = (tag: string) => {
    updateTags(currentTags.filter((t) => t !== tag));
  };

  /** 区切り（半角・全角のカンマ、読点）までを確定し、残りを入力中の 1 件にする */
  const splitDraft = (value: string) => {
    const parts = value.split(TAG_SEPARATOR_PATTERN);
    const rest = parts.pop() ?? "";
    if (parts.length > 0) commit(parts.join(","));
    setDraft(rest);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 変換中に区切ると IME の未確定文字列を壊すため、確定（compositionend）まで待つ
    if ((e.nativeEvent as InputEvent).isComposing) {
      setDraft(e.target.value);
      return;
    }
    splitDraft(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 変換確定の Enter でタグを確定・フォームを送信しない
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      // 入力欄の Enter でフォームが送信されないようにする（タグの確定に使う）
      e.preventDefault();
      commit(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  return (
    <div className="form-group">
      <label htmlFor="visit-tags">タグを追加</label>
      <div className="input tag-input">
        {currentTags.length > 0 && (
          <ul className="tag-input-chips" aria-label="付けたタグ">
            {currentTags.map((tag) => (
              <li key={tag} className="tag-input-chip">
                <span>{tag}</span>
                <button
                  type="button"
                  className="tag-input-chip-remove"
                  aria-label={`タグ「${tag}」を外す`}
                  onClick={() => removeTag(tag)}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          id="visit-tags"
          className="tag-input-field"
          value={draft}
          onChange={handleChange}
          onCompositionEnd={(e) => splitDraft(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          // 保存ボタンを押すとき入力欄からフォーカスが外れるため、確定し忘れた 1 件もここで拾う
          onBlur={() => {
            commit(draft);
            setDraft("");
          }}
          placeholder={currentTags.length === 0 ? "例: 外気浴最高" : "続けて入力"}
          aria-describedby={HINT_ID}
          enterKeyHint="done"
        />
      </div>
      <p id={HINT_ID} className="form-hint">
        Enter か「、」で 1 件ずつ確定します
      </p>
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
