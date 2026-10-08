import { memo, useCallback, useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { EditVisitHandler, SaunaVisit } from "../../types";
import { getDisplayRating, getVisitCount, isWishlist } from "../../utils";
import { getSaunaIcon, isWishlistIcon } from "../common/markerIcon";
import { flameIconSvg, starIconSvg } from "../common/iconSvg";
import { SaunaMarkerPopup } from "./SaunaMarkerPopup";
import { useImageLightbox } from "../../hooks/useImageLightbox";

interface VisitMarkersProps {
  visits: SaunaVisit[];
  editingId: string | null;
  selectedId?: string | null;
  hoveredId?: string | null;
  showBadges?: boolean;
  enableClustering?: boolean;
  onEdit: EditVisitHandler;
  onSelectVisit?: (visit: SaunaVisit) => void;
}

interface MarkerClusterLike {
  getChildCount(): number;
  getAllChildMarkers?(): L.Marker[];
}

const clusterIconCache = new Map<string, L.DivIcon>();

/**
 * 行きたい記録もクラスタにまとめ、含むクラスタには星のバッジを付ける。
 * 行きたいピンをクラスタの外に置くと、同じ地域のクラスタの上に重なって件数が読めなくなる。
 */
export const createCustomClusterIcon = (cluster: MarkerClusterLike) => {
  const count = cluster.getChildCount();
  const hasWishlist =
    cluster.getAllChildMarkers?.().some((marker) => isWishlistIcon(marker.options.icon)) ?? false;
  const cacheKey = `${count}_${hasWishlist ? 1 : 0}`;
  const cached = clusterIconCache.get(cacheKey);
  if (cached) return cached;

  let sizeClass = "sauna-cluster--small";
  if (count >= 20) {
    sizeClass = "sauna-cluster--large";
  } else if (count >= 5) {
    sizeClass = "sauna-cluster--medium";
  }

  const wishlistBadge = hasWishlist
    ? `<span class="sauna-cluster-wishlist" title="行きたいを含む">${starIconSvg(10)}</span>`
    : "";

  const icon = L.divIcon({
    html: `<div class="sauna-cluster ${sizeClass}"><span class="sauna-cluster-icon">${flameIconSvg(16)}</span><span class="sauna-cluster-count">${count}</span>${wishlistBadge}</div>`,
    className: "custom-cluster-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

  clusterIconCache.set(cacheKey, icon);
  return icon;
};

function VisitMarkersComponent({
  visits,
  editingId,
  selectedId,
  hoveredId,
  showBadges = false,
  enableClustering = true,
  onEdit,
  onSelectVisit,
}: VisitMarkersProps) {
  const { openImage } = useImageLightbox();

  const renderMarker = useCallback(
    (visit: SaunaVisit) => {
      const visitCount = getVisitCount(visit);
      const isHovered = visit.id === hoveredId;
      const isSelected = visit.id === selectedId;
      const wishlist = isWishlist(visit);

      return (
        <Marker
          key={visit.id}
          position={[visit.lat, visit.lng]}
          zIndexOffset={
            isSelected ? 1000 : isHovered ? 500 : wishlist ? 100 : undefined
          }
          icon={getSaunaIcon({
            selected: visit.id === editingId || isSelected,
            wishlist,
            hovered: isHovered,
            rating: getDisplayRating(visit),
            visitCount,
            showBadges,
          })}
          eventHandlers={{
            click: () => onSelectVisit?.(visit),
          }}
        >
          <Popup autoPan={false}>
            <SaunaMarkerPopup
              visit={visit}
              isWishlist={wishlist}
              onEdit={onEdit}
              onOpenImage={openImage}
            />
          </Popup>
        </Marker>
      );
    },
    [editingId, hoveredId, onEdit, onSelectVisit, openImage, selectedId, showBadges],
  );

  const { priorityVisits, normalVisits } = useMemo(() => {
    const priority: SaunaVisit[] = [];
    const normal: SaunaVisit[] = [];

    const len = visits.length;
    for (let i = 0; i < len; i++) {
      const visit = visits[i];
      // 選択中・編集中のピンだけはクラスタに隠さない（行きたいはクラスタのバッジで示す）
      if (visit.id === selectedId || visit.id === editingId) {
        priority.push(visit);
      } else {
        normal.push(visit);
      }
    }

    return { priorityVisits: priority, normalVisits: normal };
  }, [visits, selectedId, editingId]);

  if (!enableClustering) {
    return <>{visits.map(renderMarker)}</>;
  }

  return (
    <>
      <MarkerClusterGroup
        iconCreateFunction={createCustomClusterIcon}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        maxClusterRadius={50}
      >
        {normalVisits.map(renderMarker)}
      </MarkerClusterGroup>
      {priorityVisits.map(renderMarker)}
    </>
  );
}

const areVisitsEqual = (
  a: import("../../types").SaunaVisit[],
  b: import("../../types").SaunaVisit[],
) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].lat !== b[i].lat || a[i].lng !== b[i].lng) return false;
  }
  return true;
};

const propsAreEqual = (prev: VisitMarkersProps, next: VisitMarkersProps) => {
  if (prev.editingId !== next.editingId) return false;
  if (prev.selectedId !== next.selectedId) return false;
  if (prev.hoveredId !== next.hoveredId) return false;
  if (prev.showBadges !== next.showBadges) return false;
  if (prev.enableClustering !== next.enableClustering) return false;
  if (prev.onEdit !== next.onEdit) return false;
  if (prev.onSelectVisit !== next.onSelectVisit) return false;
  if (!areVisitsEqual(prev.visits, next.visits)) return false;
  return true;
};

export const VisitMarkers = memo(VisitMarkersComponent, propsAreEqual);
