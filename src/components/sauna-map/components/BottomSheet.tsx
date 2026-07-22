import { ReactNode, useRef, useState, TouchEvent, MouseEvent } from "react";

export type SheetSnapPosition = "min" | "half" | "full";

interface BottomSheetProps {
  snapPosition: SheetSnapPosition;
  onSnapChange: (snap: SheetSnapPosition) => void;
  children: ReactNode;
}

export function BottomSheet({
  snapPosition,
  onSnapChange,
  children,
}: BottomSheetProps) {
  const startYRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diffY = startYRef.current - endY; // 正なら上スワイプ、負なら下スワイプ
    startYRef.current = null;
    setIsDragging(false);

    if (Math.abs(diffY) > 40) {
      if (diffY > 0) {
        // 上へ引いた
        if (snapPosition === "min") onSnapChange("half");
        else if (snapPosition === "half") onSnapChange("full");
      } else {
        // 下へ引いた
        if (snapPosition === "full") onSnapChange("half");
        else if (snapPosition === "half") onSnapChange("min");
      }
    }
  };

  const handleHandleClick = () => {
    if (snapPosition === "min") onSnapChange("half");
    else if (snapPosition === "half") onSnapChange("full");
    else onSnapChange("min");
  };

  return (
    <div
      className={`bottom-sheet bottom-sheet--${snapPosition} ${
        isDragging ? "is-dragging" : ""
      }`}
      role="region"
      aria-label="ボトムシートパネル"
    >
      <div
        className="bottom-sheet-handle-wrapper"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleHandleClick}
        title="タップまたはスワイプでパネルを開閉"
      >
        <div className="bottom-sheet-handle" />
      </div>
      <div className="bottom-sheet-content">{children}</div>
    </div>
  );
}
