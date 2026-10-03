"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { LatLng } from "../../types";
import { prefersReducedMotion } from "../../utils/motion";

interface MapControllerProps {
  target: LatLng | null;
  isMobile?: boolean;
}

/**
 * デスクトップで地図の左側を覆っているサイドバーの幅（px）。
 * 折りたたみ中（.collapsed）や未描画のときは 0 を返す。
 */
function getCoveredWidth(map: LeafletMap): number {
  const sidebar = document.querySelector(".sidebar:not(.collapsed)");
  if (!sidebar) return 0;
  const sidebarRect = sidebar.getBoundingClientRect();
  const containerRect = map.getContainer().getBoundingClientRect();
  const covered = sidebarRect.right - containerRect.left;
  // サイドバーが地図の大半を覆うような狭い画面ではずらさない（マーカーが画面外へ出るため）
  if (covered <= 0 || covered >= containerRect.width / 2) return 0;
  return covered;
}

export function MapController({ target, isMobile = false }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const currentZoom = map.getZoom();
    const nextZoom = currentZoom < 14 ? 14 : currentZoom;

    // モバイル表示の際、下部のBottomSheetに隠れないよう緯度を少し南へオフセット（マーカーを画面上寄りに表示）
    const latOffset = isMobile ? (nextZoom >= 15 ? 0.0025 : 0.0045) : 0;
    let targetCenter: [number, number] = [target.lat - latOffset, target.lng];

    // デスクトップでは、サイドバーに覆われていない領域の中央にマーカーが来るよう、
    // 地図の中心を覆われた幅の半分だけ左へずらす
    const coveredWidth = isMobile ? 0 : getCoveredWidth(map);
    if (coveredWidth > 0) {
      const point = map.project([target.lat, target.lng], nextZoom).subtract([coveredWidth / 2, 0]);
      const shifted = map.unproject(point, nextZoom);
      targetCenter = [shifted.lat, shifted.lng];
    }

    map.flyTo(targetCenter, nextZoom, {
      animate: !prefersReducedMotion(),
      duration: 1.2,
    });
  }, [target, isMobile, map]);

  return null;
}
