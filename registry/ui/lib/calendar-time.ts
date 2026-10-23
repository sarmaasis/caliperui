/* Local date-time helpers shared by the week calendar and the calendar app.
   Times are local "YYYY-MM-DDTHH:mm" strings, so an event never moves when
   the viewer's time zone differs from the server's. */

export const pad = (n: number) => String(n).padStart(2, "0");

export function parseLocal(value: string) {
  const [date, time = "00:00"] = value.split("T");
  const [y, m, d] = date!.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y!, m! - 1, d!, h!, mi!);
}

export const formatLocal = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const dayKey = (date: Date) => formatLocal(date).slice(0, 10);
export const hm = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();

/** The first day of the week holding `date`; 1 starts weeks on Monday, 0 on Sunday. */
export function startOfWeek(date: Date, weekStart: 0 | 1 = 1) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  day.setDate(day.getDate() - ((day.getDay() - weekStart + 7) % 7));
  return day;
}
export const mondayOf = (date: Date) => startOfWeek(date, 1);

export function addMinutes(date: Date, minutes: number, days = 0) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  next.setDate(next.getDate() + days);
  return next;
}

/** Lays overlapping items side by side: each gets a column and the column count of its cluster. */
export function layoutColumns<T extends { s: number; f: number }>(list: readonly T[]) {
  const sorted = [...list].sort((a, b) => a.s - b.s || b.f - a.f);
  const out: (T & { col: number; cols: number })[] = [];
  let group: (T & { col: number; cols: number })[] = [];
  let end = -1;
  const flush = () => {
    const n = Math.max(0, ...group.map((g) => g.col)) + 1;
    group.forEach((g) => (g.cols = n));
    out.push(...group);
    group = [];
  };
  for (const item of sorted) {
    if (item.s >= end && group.length) {
      flush();
      end = -1;
    }
    const used = new Set(group.filter((g) => g.f > item.s).map((g) => g.col));
    let col = 0;
    while (used.has(col)) col++;
    group.push({ ...item, col, cols: 1 });
    end = Math.max(end, item.f);
  }
  flush();
  return out;
}
