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

  // 選んだ記録へは選んだときだけ寄せる。描画件数（visibleCount）の増加では寄せない
  // （一覧を下へ読み進めて追加読み込みが走るたびに、選択中の行へ引き戻されるため）。
  // 選んだ記録の行は visibleCount が selectedIndex + 1 以上を保証するため、同じ描画で DOM にある
  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const targetEl = containerRef.current.querySelector<HTMLElement>(
      `[data-visit-id="${selectedId}"]`
    );
    targetEl?.scrollIntoView?.({ behavior: getScrollBehavior(), block: "center" });
  }, [selectedId]);

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
