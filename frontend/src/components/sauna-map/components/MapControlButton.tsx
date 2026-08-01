"use client";

import { ReactNode, MouseEvent } from "react";

export interface MapControlButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  /** トグルボタンの場合のみ渡す。渡すと aria-pressed が付き .is-active が当たる */
  active?: boolean;
  children: ReactNode;
}

export function MapControlButton({
  onClick,
  title,
  ariaLabel,
  className = "",
  disabled = false,
  active,
  children,
}: MapControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${active ? "is-active" : ""}`.trim()}
      // ズームボタンなどトグルでないものには付けない
      aria-pressed={active}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
