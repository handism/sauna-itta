export interface SaunaVisit {
  id: string;
  name: string;
  lat: number;
  lng: number;
  comment: string;
  image?: string;
  date: string;
  rating?: number;
  tags?: string[];
  status?: "visited" | "wishlist";
  area?: string;
  visitCount?: number;
}

export interface VisitFormState {
  name: string;
  comment: string;
  image: string;
  date: string;
  rating: number;
  tagsText: string;
  status: "visited" | "wishlist";
  area: string;
  visitCount: number;
}

export interface VisitFilters {
  search: string;
  status: "all" | "visited" | "wishlist";
  minRating: number;
  sort: "recent" | "oldest" | "ratingDesc" | "ratingAsc";
}

export interface VisitStats {
  total: number;
  visitedCount: number;
  wishlistCount: number;
  firstDate: string | null;
  lastDate: string | null;
  avgRating: number;
  uniqueAreas: number;
  prefectures: string[];
  prefectureCount: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}
