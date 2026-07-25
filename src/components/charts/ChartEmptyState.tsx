import type { LucideIcon } from "lucide-react";

interface ChartEmptyStateProps {
  icon: LucideIcon;
  message: string;
}

/**
 * グラフにデータが無い場合の表示。
 * レイアウトは base.css の `.chart-empty-state` が担うため、インラインスタイルは持たない。
 */
export function ChartEmptyState({ icon: Icon, message }: ChartEmptyStateProps) {
  return (
    <div className="chart-empty-state">
      <Icon size={32} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
