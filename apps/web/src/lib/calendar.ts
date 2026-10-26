/**
 * Monthly heatmap model for the Review view, ported from the design prototype's
 * `reviewVals` computation. July 2026 starts on a Wednesday, so the grid opens
 * with three blank cells; the 17th is "today" and later days have no data yet.
 */

const BLANK_LEADING_CELLS = 3;
const DAYS_IN_MONTH = 31;
const TODAY = 17;
const SEGMENTS_PER_DAY = 3;

/** Score 0–3 per elapsed day; days after TODAY have not happened yet. */
const scores: Readonly<Record<number, number>> = {
  1: 2,
  2: 3,
  3: 1,
  4: 0,
  5: 1,
  6: 3,
  7: 2,
  8: 3,
  9: 2,
  10: 1,
  11: 0,
  12: 1,
  13: 3,
  14: 2,
  15: 3,
  16: 1,
  17: 2,
};

export type CalendarBlank = { kind: 'blank' };

export type CalendarDay = {
  kind: 'day';
  day: number;
  /** 0–3 for elapsed days, `null` once the day is in the future. */
  score: number | null;
  isToday: boolean;
  isFuture: boolean;
  /** One flag per score segment: active while `score` exceeds the segment index. */
  segments: readonly boolean[];
};

export type CalendarCell = CalendarBlank | CalendarDay;

export function buildCalendar(): readonly CalendarCell[] {
  const cells: CalendarCell[] = Array.from(
    { length: BLANK_LEADING_CELLS },
    (): CalendarBlank => ({ kind: 'blank' }),
  );

  for (let day = 1; day <= DAYS_IN_MONTH; day += 1) {
    const isFuture = day > TODAY;
    const score = isFuture ? null : (scores[day] ?? 0);

    cells.push({
      kind: 'day',
      day,
      score,
      isToday: day === TODAY,
      isFuture,
      segments: Array.from(
        { length: SEGMENTS_PER_DAY },
        (_, index) => score !== null && score > index,
      ),
    });
  }

  return cells;
}
