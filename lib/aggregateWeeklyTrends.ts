import type { Anomaly, PayrollRecord } from "./types";
import { payrollForRecord, sumHours } from "./aggregatePayroll";

export interface WeeklyTrendPoint {
  weekEnding: string;
  weekLabel: string;
  payroll: number;
  apprenticeHoursPct: number;
  anomalyCount: number;
}

function parseWeekEnding(dateStr: string): Date {
  const [m, d, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekLabel(dateStr: string): string {
  const d = parseWeekEnding(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getWeeklyTrendsData(
  records: PayrollRecord[],
  anomalies: Anomaly[] = []
): WeeklyTrendPoint[] {
  const byWeek = new Map<
    string,
    { payroll: number; apprenticeHours: number; totalHours: number; anomalyCount: number }
  >();

  for (const r of records) {
    const key = r.week_ending;
    const existing = byWeek.get(key) ?? {
      payroll: 0,
      apprenticeHours: 0,
      totalHours: 0,
      anomalyCount: 0,
    };

    const recordHours = sumHours(r);
    const pay = payrollForRecord(r);

    existing.payroll += pay;
    existing.totalHours += recordHours;
    if (r.level === "APPRENTICE") {
      existing.apprenticeHours += recordHours;
    }

    byWeek.set(key, existing);
  }

  for (const a of anomalies) {
    const key = a.record.week_ending;
    const existing = byWeek.get(key);
    if (existing) {
      existing.anomalyCount += 1;
    }
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => parseWeekEnding(a).getTime() - parseWeekEnding(b).getTime())
    .map(([weekEnding, { payroll, apprenticeHours, totalHours, anomalyCount }]) => ({
      weekEnding,
      weekLabel: formatWeekLabel(weekEnding),
      payroll,
      apprenticeHoursPct:
        totalHours > 0 ? (apprenticeHours / totalHours) * 100 : 0,
      anomalyCount,
    }));
}
