import { z } from "zod";

// --- 地理座標型 ---
export interface LatLng {
  lat: number;
  lng: number;
}

// --- ドメイン型基本定義 ---
export type VisitStatus = "visited" | "wishlist";

// --- Zod バリデーションスキーマ ---
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
  status: z.enum(["visited", "wishlist"] as const).optional(),
  area: z.string().optional(),
  visitCount: z.number().optional(),
  history: z.array(VisitHistoryEntrySchema).optional(),
});

export const VisitFormInputSchema = z.object({
  name: z.string().trim().min(1, "サウナ名を入力してください。"),
  comment: z.string(),
  image: z.string().optional(),
  date: z.string().refine((val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val), "日付の形式が正しくありません。"),
  rating: z.number().min(0, "満足度は0以上で指定してください。").max(5, "満足度は5以下で指定してください。"),
  tagsText: z.string(),
  status: z.enum(["visited", "wishlist"] as const),
  area: z.string().optional(),
  appendHistory: z.boolean().optional(),
});

// --- TypeScript 型定義 (ドメインモデル) ---
export type SaunaVisit = z.infer<typeof SaunaVisitSchema>;
export type VisitHistoryEntry = z.infer<typeof VisitHistoryEntrySchema>;

// --- 統計データモデル ---
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
