import { useEffect, useRef, useState } from "react";
import { SaunaVisit } from "../types";
import { getScrollBehavior } from "../utils/motion";

export function useIncrementalList(
  filteredVisits: SaunaVisit[],
  selectedId: string | null,
  initialRenderCount: number,
  chunkSize: number
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [extraCount, setExtraCount] = useState(0);

  const selectedIndex = selectedId
    ? filteredVisits.findIndex((v) => v.id === selectedId)
    : -1;
  const visibleCount = Math.max(
    initialRenderCount + extraCount,
    selectedIndex + 1
  );
  const renderedVisits = filteredVisits.slice(0, visibleCount);
  const hasMore = filteredVisits.length > renderedVisits.length;

  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const targetEl = containerRef.current.querySelector<HTMLElement>(
      `[data-visit-id="${selectedId}"]`
    );
    targetEl?.scrollIntoView?.({ behavior: getScrollBehavior(), block: "center" });
  }, [selectedId, visibleCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver !== "function") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setExtraCount((prev) => prev + chunkSize);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [visibleCount, filteredVisits.length, chunkSize]);

  const loadMore = () => setExtraCount((prev) => prev + chunkSize);

  return {
    containerRef,
    sentinelRef,
    renderedVisits,
    hasMore,
    loadMore,
  };
}
