import { useState, useCallback, useMemo } from "react";
import { SaunaVisit, LatLng, SheetSnapPosition } from "../types";

export function useMapViewState(visits: SaunaVisit[], isMobile: boolean) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapTargetOverride, setMapTargetOverride] = useState<LatLng | null>(null);
  const [snapPosition, setSnapPosition] = useState<SheetSnapPosition>("min");
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);

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
