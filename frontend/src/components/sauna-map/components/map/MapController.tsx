"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLng } from "../../types";
import { prefersReducedMotion } from "../../utils/motion";
import { getCoveredWidth } from "./mapInsets";

/**
 * 記録を選んだときに寄るズーム。14 以上（街区）まで寄ると周りに他の記録が 1 件も無く、
 * どのあたりにいるのか分からなくなるため、駅や地区の名前が読める 13 に留める。
 * これより拡大していれば縮小はしない。
 */
export const SELECT_ZOOM = 13;

interface MapControllerProps {
  target: LatLng | null;
  isMobile?: boolean;
}

export function MapController({ target, isMobile = false }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const currentZoom = map.getZoom();
    const nextZoom = Math.max(currentZoom, SELECT_ZOOM);

    // モバイル表示の際、下部のBottomSheetに隠れないよう緯度を少し南へオフセット（マーカーを画面上寄りに表示）。
    // 同じ画面上の距離にするため、ズームが 1 段上がるごとに半分にする（ズーム 14 で 0.0045）
    const latOffset = isMobile ? 0.0045 * Math.pow(2, 14 - nextZoom) : 0;
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
