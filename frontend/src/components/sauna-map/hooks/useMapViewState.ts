import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { SaunaVisit, LatLng, SheetSnapPosition } from "../types";

export function useMapViewState(visits: SaunaVisit[], isMobile: boolean) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapTargetOverride, setMapTargetOverride] = useState<LatLng | null>(null);
  const [snapPosition, setSnapPosition] = useState<SheetSnapPosition>("min");
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);

  const handledUrlIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || visits.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("id");
    if (!targetId || handledUrlIdRef.current === targetId) return;

    const targetVisit = visits.find((v) => v.id === targetId);
    if (targetVisit) {
      handledUrlIdRef.current = targetId;
      queueMicrotask(() => {
        setSelectedId(targetVisit.id);
        setHoveredId(targetVisit.id);
        setMapTargetOverride({ lat: targetVisit.lat, lng: targetVisit.lng });
        if (isMobile) {
          setSnapPosition("min");
        }
      });
    }
  }, [visits, isMobile]);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  const showBadges = zoomLevel >= 13;

  const selectedVisit = useMemo(
    () => visits.find((v) => v.id === selectedId),
    [visits, selectedId]
  );

  const handleSelectVisit = useCallback(
    (visit: SaunaVisit) => {
      setSelectedId(visit.id);
      setHoveredId(visit.id);
      setMapTargetOverride({ lat: visit.lat, lng: visit.lng });
      if (isMobile) {
        setSnapPosition("min");
      }
    },
    [isMobile]
  );

  const handleDeselectVisit = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
    setMapTargetOverride(null);
  }, []);

  const toggleClustering = useCallback(() => {
    setEnableClustering((prev) => !prev);
  }, []);

  return {
    hoveredId,
    setHoveredId,
    selectedId,
    setSelectedId,
    mapTargetOverride,
    setMapTargetOverride,
    snapPosition,
    setSnapPosition,
    zoomLevel,
    handleZoomChange,
    enableClustering,
    toggleClustering,
    showBadges,
    selectedVisit,
    handleSelectVisit,
    handleDeselectVisit,
  };
}
