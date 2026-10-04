"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLng } from "../../types";
import { prefersReducedMotion } from "../../utils/motion";
import { SELECT_ZOOM } from "./MapController";

interface SelectedLocationFocusProps {
  location: LatLng | null;
}

/**
 * 新規登録で選んだ場所が地図の表示範囲の外にあるときだけ、そこへ移動する。
 * 地点検索で選んだ場所は今見ている範囲の外にあることが多く、移動しないと
 * 立てたピンを確かめられない。地図をタップして選んだ場所は必ず範囲内なので動かさない
 * （タップのたびに地図が動くと、続けて位置を微調整できない）。
 */
export function SelectedLocationFocus({ location }: SelectedLocationFocusProps) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    if (map.getBounds().contains([location.lat, location.lng])) return;

    map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), SELECT_ZOOM), {
      animate: !prefersReducedMotion(),
      duration: 1.2,
    });
  }, [location, map]);

  return null;
}
