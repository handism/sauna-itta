"use client";

import { ReactNode, MouseEvent } from "react";

export interface MapControlButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}

export function MapControlButton({
  onClick,
  title,
  ariaLabel,
  className = "",
  disabled = false,
  active = false,
  children,
}: MapControlButtonProps) {
  const activeClass = active ? "map-control-btn--active" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${activeClass} ${className}`.trim()}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
