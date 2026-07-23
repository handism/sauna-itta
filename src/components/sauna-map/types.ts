import { z } from "zod";

export const VisitHistoryEntrySchema = z.object({
  date: z.string(),
  comment: z.string(),
  rating: z.number().optional(),
  image: z.string().optional(),
});

export const SaunaVisitSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  comment: z.string(),
  image: z.string().optional(),
  date: z.string(),
  rating: z.number().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["visited", "wishlist"]).optional(),
  area: z.string().optional(),
  visitCount: z.number().optional(),
  history: z.array(VisitHistoryEntrySchema).optional(),
});

export type SaunaVisit = z.infer<typeof SaunaVisitSchema>;
export type VisitHistoryEntry = z.infer<typeof VisitHistoryEntrySchema>;

export interface VisitFormState {
  name: string;
  comment: string;
  image: string;
  date: string;
  rating: number;
  tagsText: string;
  status: "visited" | "wishlist";
  area: string;
  appendHistory: boolean;
}

export interface VisitFilters {
  search: string;
  status: "all" | "visited" | "wishlist";
  minRating: number;
  sort: "recent" | "oldest" | "ratingDesc" | "ratingAsc" | "visitCountDesc" | "nameAsc";
  selectedTag?: string;
  selectedArea?: string;
  filterByBounds?: boolean;
  mapBounds?: { northEast: LatLng; southWest: LatLng } | null;
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

export type SheetSnapPosition = "min" | "half" | "full";
