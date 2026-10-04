/**
 * 統計ページの年間ヒートマップ（GitHub の草のような表）の組み立て。
 * 列が週（日曜始まり）、行が曜日で、最後に訪問した日を含む週を右端にして過去へ遡る。
 * 訪問日は統計ページの visitDates と同じく `Date#toDateString()` をキーにした件数で受け取る。
 */

/** 表示する週の数。53 週あれば、どの曜日に終わっても丸 1 年が収まる */
export const HEATMAP_WEEKS = 53;

export type HeatmapLevel = 0 | 1 | 2 | 3;

export interface HeatmapDay {
  /** visitDates のキー（Date#toDateString()） */
  key: string;
  date: Date;
  count: number;
  /** 0 = 訪問なし、1 = 1 回、2 = 2 回、3 = 3 回以上 */
  level: HeatmapLevel;
  /** 右端の週のうち、最終日より後の日（まだ来ていない日）は false。マスを描かない */
  inRange: boolean;
}

export interface HeatmapWeek {
  days: HeatmapDay[];
  /** その週に月の 1 日が含まれるときの見出し（「4月」など）。それ以外は null */
  monthLabel: string | null;
}

export interface VisitHeatmap {
  weeks: HeatmapWeek[];
  start: Date;
  end: Date;
  /** 期間内に訪問した日数 */
  activeDays: number;
  /** 期間内の訪問回数 */
  totalVisits: number;
}

function toLevel(count: number): HeatmapLevel {
  if (count <= 0) return 0;
  if (count >= 3) return 3;
  return count as 1 | 2;
}

/** visitDates のキーのうち最も新しい日。1 件も読めなければ null */
export function getLatestVisitDate(visitDates: Map<string, number>): Date | null {
  let latest: Date | null = null;
  for (const key of visitDates.keys()) {
    const d = new Date(key);
    if (Number.isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

export function buildVisitHeatmap(
  visitDates: Map<string, number>,
  end: Date,
  weekCount = HEATMAP_WEEKS,
): VisitHeatmap {
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  // 右端の列は最終日を含む週（日曜〜土曜）。そこから weekCount 週ぶん遡った日曜が左上
  const firstSunday = new Date(endDay);
  firstSunday.setDate(endDay.getDate() - endDay.getDay() - (weekCount - 1) * 7);

  const weeks: HeatmapWeek[] = [];
  let activeDays = 0;
  let totalVisits = 0;

  for (let w = 0; w < weekCount; w++) {
    const days: HeatmapDay[] = [];
    let monthLabel: string | null = null;

    for (let d = 0; d < 7; d++) {
      const date = new Date(firstSunday);
      date.setDate(firstSunday.getDate() + w * 7 + d);
      const inRange = date <= endDay;
      const key = date.toDateString();
      const count = inRange ? (visitDates.get(key) ?? 0) : 0;

      if (count > 0) {
        activeDays++;
        totalVisits += count;
      }
      // 左端の列は月の途中から始まるため見出しを付けない（直後の月の見出しと重なる）
      if (w > 0 && inRange && date.getDate() === 1) {
        monthLabel = `${date.getMonth() + 1}月`;
      }

      days.push({ key, date, count, level: toLevel(count), inRange });
    }

    weeks.push({ days, monthLabel });
  }

  return { weeks, start: firstSunday, end: endDay, activeDays, totalVisits };
}
