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
