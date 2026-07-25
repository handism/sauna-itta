/**
 * OS の「視差効果を減らす / アニメーションを減らす」設定を参照する。
 * CSS 側 (base.css の prefers-reduced-motion ブロック) では抑制できない
 * JS 由来のアニメーション（Leaflet の flyTo, scrollIntoView）で使う。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** scrollIntoView に渡す behavior を設定に応じて切り替える */
export function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
