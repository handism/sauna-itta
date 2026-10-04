import type { Map as LeafletMap } from "leaflet";

/**
 * デスクトップで地図の左側を覆っているサイドバーの幅（px）。
 * 折りたたみ中（.collapsed）や未描画のときは 0 を返す。
 */
export function getCoveredWidth(map: LeafletMap): number {
  const sidebar = document.querySelector(".sidebar:not(.collapsed)");
  if (!sidebar) return 0;
  const sidebarRect = sidebar.getBoundingClientRect();
  const containerRect = map.getContainer().getBoundingClientRect();
  const covered = sidebarRect.right - containerRect.left;
  // サイドバーが地図の大半を覆うような狭い画面ではずらさない（マーカーが画面外へ出るため）
  if (covered <= 0 || covered >= containerRect.width / 2) return 0;
  return covered;
}

/**
 * モバイルで地図の下側を覆っているボトムシート（と下部ナビ）の高さ（px）。
 * 地図の半分以上を覆うとき（シートを全画面へ広げているとき）は 0 を返す。
 */
export function getCoveredHeight(map: LeafletMap): number {
  const containerRect = map.getContainer().getBoundingClientRect();
  let top = containerRect.bottom;
  for (const el of document.querySelectorAll(".bottom-sheet, .mobile-nav-bar")) {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) top = Math.min(top, rect.top);
  }
  const covered = containerRect.bottom - top;
  if (covered <= 0 || covered >= containerRect.height / 2) return 0;
  return covered;
}
