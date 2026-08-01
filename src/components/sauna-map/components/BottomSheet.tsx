import {
  ReactNode,
  useRef,
  TouchEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MapPin } from "lucide-react";
import type { SheetSnapPosition } from "../types";

/**
 * スナップ位置の並び（下 → 上）。1 段ずつの移動はクリック・キー操作・フリックの
 * 3 経路から起きるため、遷移表はここに 1 つだけ持つ。
 */
const SNAP_ORDER: SheetSnapPosition[] = ["min", "half", "full"];

/** 端に達している場合は null を返す（そのとき呼び出し側は何もしないこと） */
function stepSnap(current: SheetSnapPosition, direction: 1 | -1): SheetSnapPosition | null {
  return SNAP_ORDER[SNAP_ORDER.indexOf(current) + direction] ?? null;
}

interface BottomSheetProps {
  snapPosition: SheetSnapPosition;
  onSnapChange: (snap: SheetSnapPosition) => void;
  filteredCount?: number;
  selectedVisitName?: string;
  children: ReactNode;
}

export function BottomSheet({
  snapPosition,
  onSnapChange,
  filteredCount,
  selectedVisitName,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  /** 端では onSnapChange を呼ばない（同じ位置への通知で再レンダリングさせないため） */
  const step = (direction: 1 | -1) => {
    const next = stepSnap(snapPosition, direction);
    if (next) onSnapChange(next);
  };

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => {
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    if (sheetRef.current) {
      sheetRef.current.classList.add("is-dragging");
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLButtonElement>) => {
    if (startYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    let diffY = currentY - startYRef.current; // 正: 下へ, 負: 上へ

    // 端の抵抗感（Over-scroll resistance）
    if (snapPosition === "full" && diffY < 0) {
      diffY *= 0.25;
    } else if (snapPosition === "min" && diffY > 0) {
      diffY *= 0.25;
    }

    if (sheetRef.current) {
      sheetRef.current.style.setProperty("--drag-offset-y", `${diffY}px`);
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLButtonElement>) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diffY = startYRef.current - endY; // 正: 上へスワイプ, 負: 下へスワイプ
    const elapsedTime = Math.max(Date.now() - startTimeRef.current, 1);
    const velocity = diffY / elapsedTime; // px/ms

    startYRef.current = null;
    if (sheetRef.current) {
      sheetRef.current.classList.remove("is-dragging");
      sheetRef.current.style.setProperty("--drag-offset-y", "0px");
    }

    // 強烈なスワイプ（速いフリック）または距離閾値の判定
    const isFlickUp = velocity > 0.4 || diffY > 50;
    const isFlickDown = velocity < -0.4 || diffY < -50;
    const isStrongFlickUp = velocity > 1.2 || diffY > 200;
    const isStrongFlickDown = velocity < -1.2 || diffY < -200;

    if (isStrongFlickUp) {
      onSnapChange("full");
    } else if (isStrongFlickDown) {
      onSnapChange("min");
    } else if (isFlickUp) {
      step(1);
    } else if (isFlickDown) {
      step(-1);
    }
  };

  // タップは 1 段ずつ上げ、最上段まで来たら最小へ戻す
  const handleHandleClick = () => {
    if (snapPosition === "full") {
      onSnapChange("min");
    } else {
      step(1);
    }
  };

  // キーボード操作でも 3 段階のスナップを行き来できるようにする
  const handleHandleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      step(-1);
    }
  };

  const handleLabel =
    snapPosition === "min"
      ? "パネルを開く"
      : snapPosition === "half"
        ? "パネルを最大化する"
        : "パネルを閉じる";

  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet bottom-sheet--${snapPosition}`}
      role="region"
      aria-label="ボトムシートパネル"
    >
      <div className="bottom-sheet-header">
        <button
          type="button"
          className="bottom-sheet-handle-wrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleHandleClick}
          onKeyDown={handleHandleKeyDown}
          aria-label={handleLabel}
          aria-expanded={snapPosition !== "min"}
          aria-controls="bottom-sheet-content"
          title="タップまたはスワイプでパネルを開閉"
        >
          {/* button の子要素は phrasing content に限られるため span で構成する */}
          <span className="bottom-sheet-handle-bar-container">
            <span className="bottom-sheet-handle" />
            <span className="bottom-sheet-summary-badge">
              <span className="summary-count">
                <MapPin size={13} /> {filteredCount ?? 0}件表示中
              </span>
              {selectedVisitName && (
                <span className="summary-selected" title={selectedVisitName}>
                  選択中: {selectedVisitName}
                </span>
              )}
            </span>
          </span>
        </button>
        {selectedVisitName && snapPosition !== "min" && (
          <button
            type="button"
            className="bottom-sheet-map-btn"
            onClick={() => onSnapChange("min")}
            title="シートを閉じて地図でピンを確認"
            aria-label="シートを閉じて地図で選択中のピンを確認"
          >
            <MapPin size={13} /> 地図を見る
          </button>
        )}
      </div>
      <div className="bottom-sheet-content" id="bottom-sheet-content">
        {children}
      </div>
    </div>
  );
}

