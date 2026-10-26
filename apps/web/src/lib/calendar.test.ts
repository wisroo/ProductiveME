import { describe, expect, it } from 'vitest';
import { buildCalendar, type CalendarDay } from './calendar.js';

const days = (): CalendarDay[] =>
  buildCalendar().filter((cell): cell is CalendarDay => cell.kind === 'day');

const day = (num: number): CalendarDay => {
  const found = days().find((cell) => cell.day === num);
  if (!found) throw new Error(`No cell for day ${num}`);
  return found;
};

describe('buildCalendar', () => {
  it('pads the month with three blanks before 31 numbered days', () => {
    const cells = buildCalendar();

    expect(cells).toHaveLength(34);
    expect(cells.slice(0, 3).map((cell) => cell.kind)).toEqual([
      'blank',
      'blank',
      'blank',
    ]);
    expect(days().map((cell) => cell.day)).toEqual(
      Array.from({ length: 31 }, (_, index) => index + 1),
    );
  });

  it('marks only day 17 as today', () => {
    expect(day(17).isToday).toBe(true);
    expect(days().filter((cell) => cell.isToday)).toHaveLength(1);
  });

  it('treats days after the 17th as future with no score', () => {
    for (let d = 18; d <= 31; d += 1) {
      expect(day(d).isFuture).toBe(true);
      expect(day(d).score).toBeNull();
    }
    expect(day(17).isFuture).toBe(false);
  });

  it('activates one segment per score point on past days', () => {
    expect(day(2).score).toBe(3);
    expect(day(2).segments).toEqual([true, true, true]);

    expect(day(1).score).toBe(2);
    expect(day(1).segments).toEqual([true, true, false]);

    expect(day(3).score).toBe(1);
    expect(day(3).segments).toEqual([true, false, false]);

    expect(day(4).score).toBe(0);
    expect(day(4).segments).toEqual([false, false, false]);
  });

  it('leaves every segment inactive on future days', () => {
    expect(day(20).segments).toEqual([false, false, false]);
  });
});
