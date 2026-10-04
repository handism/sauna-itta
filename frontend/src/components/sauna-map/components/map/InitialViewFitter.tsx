"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import { LatLng } from "../../types";
import { getCoveredHeight, getCoveredWidth } from "./mapInsets";

/** 地図の縁と記録の間に空ける余白（px）。右上のコントロールにピンが重ならない程度 */
const EDGE_PADDING = 48;
/** 記録が 1 件だけ・ごく狭い範囲に固まっているときに寄りすぎないための上限 */
const MAX_FIT_ZOOM = 12;

interface InitialViewFitterProps {
  visits: LatLng[];
  /** ディープリンク（/?id=）などで別の地点へ移動する予定があるときは合わせない */
  skip?: boolean;
}

/**
 * 初めて記録が読み込まれたときに、すべての記録が見えている範囲へ地図を合わせる。
 * 固定の中心とズームでは、デスクトップは西日本のピンがサイドバーの裏に入り、
 * モバイルは北海道と九州が画面外に切れる。サイドバー・ボトムシートに覆われた分は
 * 余白として差し引く。合わせるのは 1 回だけで、その後の操作や記録の追加では動かさない。
 */
export function InitialViewFitter({ visits, skip = false }: InitialViewFitterProps) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (fittedRef.current || visits.length === 0) return;
    fittedRef.current = true;
    if (skip) return;

    const bounds = latLngBounds(visits.map((v) => [v.lat, v.lng] as [number, number]));
    if (!bounds.isValid()) return;

    map.fitBounds(bounds, {
      paddingTopLeft: [EDGE_PADDING + getCoveredWidth(map), EDGE_PADDING],
      paddingBottomRight: [EDGE_PADDING, EDGE_PADDING + getCoveredHeight(map)],
      maxZoom: MAX_FIT_ZOOM,
      animate: false,
    });
  }, [visits, skip, map]);

  return null;
}
