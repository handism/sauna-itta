import { ReactNode, useRef, useState, TouchEvent, CSSProperties } from "react";

export type SheetSnapPosition = "min" | "half" | "full";

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
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
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

    setDragOffsetY(diffY);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diffY = startYRef.current - endY; // 正: 上へスワイプ, 負: 下へスワイプ
    const elapsedTime = Math.max(Date.now() - startTimeRef.current, 1);
    const velocity = diffY / elapsedTime; // px/ms

    startYRef.current = null;
    setIsDragging(false);
    setDragOffsetY(0);

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

  const style = {
    "--drag-offset-y": `${dragOffsetY}px`,
  } as CSSProperties;

  return (
    <div
      className={`bottom-sheet bottom-sheet--${snapPosition} ${
        isDragging ? "is-dragging" : ""
      }`}
      style={style}
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
            <span className="summary-count">📍 {filteredCount ?? 0}件表示中</span>
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

