import { useId, useLayoutEffect, useRef, useState } from "react";

interface VisitCommentProps {
  text?: string;
  /** 文字サイズ等の見た目を担う呼び出し側のクラス（省略表示は visit-comment-text が担う） */
  className: string;
}

/**
 * 訪問コメント。3 行を超える分は省略し、実際にあふれたときだけ「続きを読む」を出す。
 *
 * 長文のコメントでポップアップが地図を覆ったり、一覧のカードが縦に伸びたりするのを防ぐ。
 * 省略したまま続きを読む手段が無いと内容が編集画面でしか読めなくなるため、
 * line-clamp だけで切らずに必ずこのコンポーネントを使うこと。空のコメントは何も描画しない。
 */
export function VisitComment({ text, className }: VisitCommentProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const textId = useId();

  // 省略中の高さで判定する（展開中は scrollHeight と clientHeight が一致してしまう）。
  // サイドバーの開閉等で幅が変わると行数も変わるため、要素の大きさの変化でも測り直す
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  if (!text) return null;

  return (
    <div className="visit-comment">
      <p
        ref={textRef}
        id={textId}
        className={`${className} visit-comment-text ${expanded ? "" : "is-clamped"}`}
      >
        {text}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          className="visit-comment-toggle"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={(e) => {
            // 一覧カードではカード自体のクリックが選択になるため伝播させない
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}
