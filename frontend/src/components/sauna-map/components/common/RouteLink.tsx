import { Navigation } from "lucide-react";
import { getDirectionsUrl } from "../../utils";

interface RouteLinkProps {
  lat: number;
  lng: number;
  className?: string;
}

export function RouteLink({ lat, lng, className = "route-link" }: RouteLinkProps) {
  const href = getDirectionsUrl(lat, lng);
  const safeHref = href.startsWith("http") ? href : "#";

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      <span className="route-link-icon">
        <Navigation size={14} />
      </span>
      <span className="route-link-text">ここへ行く</span>
    </a>
  );
}
