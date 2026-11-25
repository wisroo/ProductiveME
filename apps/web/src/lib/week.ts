export function localDate(now = new Date()): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

export function weekStart(now = new Date()): string {
  const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  return monday.toISOString().slice(0, 10);
}

export function adjacentWeek(week: string, offset: -1 | 1): string {
  const day = new Date(`${week}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + offset * 7);
  return day.toISOString().slice(0, 10);
}

export function shiftDate(date: string, offset: number): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

export function weekOfDate(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  return shiftDate(date, -(day.getUTCDay() + 6) % 7);
}
