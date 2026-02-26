import type { Anomaly, PayrollRecord } from "./types";

const DAY_COLUMNS = [
  ["mon_st_hours", "mon_ot_hours"],
  ["tue_st_hours", "tue_ot_hours"],
  ["wed_st_hours", "wed_ot_hours"],
  ["thu_st_hours", "thu_ot_hours"],
  ["fri_st_hours", "fri_ot_hours"],
  ["sat_st_hours", "sat_ot_hours"],
  ["sun_st_hours", "sun_ot_hours"],
] as const;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function sumRecordHours(r: PayrollRecord): { standard: number; overtime: number } {
  let standard = 0;
  let overtime = 0;
  for (const [st, ot] of DAY_COLUMNS) {
    standard += (r[st] as number) ?? 0;
    overtime += (r[ot] as number) ?? 0;
  }
  return { standard, overtime };
}

export interface EmployeeDetail {
  employeeId: number;
  name: string;
  occupation: string;
  level: "APPRENTICE" | "JOURNEYWORKER";
  totalHours: number;
  totalOvertimeHours: number;
  anomalies: Anomaly[];
}

export type HoursGroupBy = "day" | "week" | "month";

export interface HoursChartPoint {
  label: string;
  standardHours: number;
  overtimeHours: number;
}

/** Parse week_ending (MM/DD/YYYY) to Date. */
function parseWeekEnding(weekEnding: string): Date {
  const [month, day, year] = weekEnding.split("/").map(Number);
  return new Date(year, month - 1, day);
}

/** Format date as YYYY-MM for month grouping. */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Format month key for display (e.g. "2025-03" -> "Mar 2025"). */
function formatMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function getEmployeeDetail(
  records: PayrollRecord[],
  anomalies: Anomaly[],
  employeeId: number
): EmployeeDetail | null {
  const empRecords = records.filter((r) => r.employee_id === employeeId);
  if (empRecords.length === 0) return null;

  let totalHours = 0;
  let totalOvertimeHours = 0;

  for (const r of empRecords) {
    const { standard, overtime } = sumRecordHours(r);
    totalHours += standard + overtime;
    totalOvertimeHours += overtime;
  }

  const empAnomalies = anomalies.filter((a) => a.record.employee_id === employeeId);
  const first = empRecords[0];

  return {
    employeeId,
    name: first.employee_name,
    occupation: first.occupation,
    level: first.level,
    totalHours,
    totalOvertimeHours,
    anomalies: empAnomalies,
  };
}

export function getEmployeeHoursChartData(
  records: PayrollRecord[],
  employeeId: number,
  groupBy: HoursGroupBy
): HoursChartPoint[] {
  const empRecords = records
    .filter((r) => r.employee_id === employeeId)
    .sort(
      (a, b) =>
        parseWeekEnding(a.week_ending).getTime() -
        parseWeekEnding(b.week_ending).getTime()
    );

  if (empRecords.length === 0) return [];

  if (groupBy === "day") {
    const byDay = DAY_NAMES.map((label, i) => ({
      label,
      standardHours: 0,
      overtimeHours: 0,
    }));

    for (const r of empRecords) {
      for (let i = 0; i < DAY_COLUMNS.length; i++) {
        const [st, ot] = DAY_COLUMNS[i];
        byDay[i].standardHours += (r[st] as number) ?? 0;
        byDay[i].overtimeHours += (r[ot] as number) ?? 0;
      }
    }

    return byDay;
  }

  if (groupBy === "week") {
    return empRecords.map((r) => {
      const { standard, overtime } = sumRecordHours(r);
      return {
        label: r.week_ending,
        standardHours: standard,
        overtimeHours: overtime,
      };
    });
  }

  // month
  const byMonth = new Map<string, { standardHours: number; overtimeHours: number }>();

  for (const r of empRecords) {
    const key = monthKey(parseWeekEnding(r.week_ending));
    const existing = byMonth.get(key) ?? { standardHours: 0, overtimeHours: 0 };
    const { standard, overtime } = sumRecordHours(r);
    byMonth.set(key, {
      standardHours: existing.standardHours + standard,
      overtimeHours: existing.overtimeHours + overtime,
    });
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      label: formatMonthKey(key),
      standardHours: v.standardHours,
      overtimeHours: v.overtimeHours,
    }));
}
