import { ReactNode, useRef, TouchEvent } from "react";
import { MapPin } from "lucide-react";
import type { SheetSnapPosition } from "../types";

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

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    if (sheetRef.current) {
      sheetRef.current.classList.add("is-dragging");
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
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

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
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
      if (snapPosition === "min") onSnapChange("half");
      else if (snapPosition === "half") onSnapChange("full");
    } else if (isFlickDown) {
      if (snapPosition === "full") onSnapChange("half");
      else if (snapPosition === "half") onSnapChange("min");
    }
  };

  const handleHandleClick = () => {
    if (snapPosition === "min") onSnapChange("half");
    else if (snapPosition === "half") onSnapChange("full");
    else onSnapChange("min");
  };

  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet bottom-sheet--${snapPosition}`}
      role="region"
      aria-label="ボトムシートパネル"
    >
      <div
        className="bottom-sheet-handle-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleHandleClick}
        title="タップまたはスワイプでパネルを開閉"
      >
        <div className="bottom-sheet-handle-bar-container">
          <div className="bottom-sheet-handle" />
          <div className="bottom-sheet-summary-badge">
            <span className="summary-count">
              <MapPin size={13} /> {filteredCount ?? 0}件表示中
            </span>
            {selectedVisitName && (
              <span className="summary-selected" title={selectedVisitName}>
                選択中: {selectedVisitName}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="bottom-sheet-content">{children}</div>
    </div>
  );
}

