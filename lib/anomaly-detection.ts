import type { Anomaly, PayrollRecord } from "./types";

const RATE_CHANGE_THRESHOLD = 0.25; // 25%
const EXCESSIVE_WEEKLY_HOURS = 60;
const EXCESSIVE_DAILY_HOURS = 10;

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

/** Parse week_ending (MM/DD/YYYY) to Date for sorting. */
function parseWeekEnding(weekEnding: string): Date {
  const [month, day, year] = weekEnding.split("/").map(Number);
  return new Date(year, month - 1, day);
}

/** Get total weekly hours for a record. */
function getWeeklyHours(record: PayrollRecord): number {
  return DAY_COLUMNS.reduce((sum, [st, ot]) => {
    return sum + (record[st] ?? 0) + (record[ot] ?? 0);
  }, 0);
}

/** Get hours for a single day (st + ot). */
function getDayHours(record: PayrollRecord, dayIndex: number): number {
  const [st, ot] = DAY_COLUMNS[dayIndex];
  return (record[st] ?? 0) + (record[ot] ?? 0);
}

/** Check if a rate changed more than 25% from previous. */
function isRateChangeSignificant(prev: number, curr: number): boolean {
  if (prev <= 0) return false;
  const change = Math.abs(curr - prev) / prev;
  return change > RATE_CHANGE_THRESHOLD;
}

/** Detect Name/ID mismatch: an ID associated with two different names. */
function detectNameIdMismatch(records: PayrollRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const idToNames = new Map<number, Set<string>>();
  const idToFirstRecord = new Map<number, PayrollRecord>();

  for (const record of records) {
    const names = idToNames.get(record.employee_id) ?? new Set();
    names.add(record.employee_name.trim());
    idToNames.set(record.employee_id, names);
    if (!idToFirstRecord.has(record.employee_id)) {
      idToFirstRecord.set(record.employee_id, record);
    }
  }

  for (const [id, names] of idToNames) {
    if (names.size > 1) {
      const nameList = [...names].join(", ");
      const record = idToFirstRecord.get(id)!;
      anomalies.push({
        type: "NAME_ID_MISMATCH",
        record,
        description: `Employee ID ${id} is associated with multiple names: ${nameList}`,
      });
    }
  }

  return anomalies;
}

/** Detect rate changes > 25% from previous week. */
function detectRateChange(records: PayrollRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byEmployee = groupByEmployeeSortedByWeek(records);

  for (const [employeeId, employeeRecords] of byEmployee) {
    for (let i = 1; i < employeeRecords.length; i++) {
      const prev = employeeRecords[i - 1];
      const curr = employeeRecords[i];

      const rateTypes = [
        { key: "standard_rate" as const, label: "standard" },
        { key: "overtime_rate" as const, label: "overtime" },
        { key: "benefits_rate" as const, label: "benefits" },
      ] as const;

      for (const { key, label } of rateTypes) {
        const prevRate = prev[key];
        const currRate = curr[key];
        if (isRateChangeSignificant(prevRate, currRate)) {
          const direction = currRate > prevRate ? "increased" : "decreased";
          anomalies.push({
            type: "RATE_CHANGE",
            record: curr,
            description: `${label} rate ${direction} from ${prevRate.toFixed(2)} to ${currRate.toFixed(2)} (week ${curr.week_ending})`,
            previousValue: prevRate,
          });
        }
      }
    }
  }

  return anomalies;
}

/** Detect level change: APPRENTICE ↔ JOURNEYWORKER. */
function detectLevelChange(records: PayrollRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byEmployee = groupByEmployeeSortedByWeek(records);

  for (const [, employeeRecords] of byEmployee) {
    for (let i = 1; i < employeeRecords.length; i++) {
      const prev = employeeRecords[i - 1];
      const curr = employeeRecords[i];

      if (prev.level !== curr.level) {
        anomalies.push({
          type: "LEVEL_CHANGE",
          record: curr,
          description: `Level changed from ${prev.level} to ${curr.level} (week ${curr.week_ending})`,
          previousValue: prev.level,
        });
      }
    }
  }

  return anomalies;
}

/** Detect excessive hours: 60+ week or 10+ hour days. */
function detectExcessiveHours(records: PayrollRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const record of records) {
    const weeklyHours = getWeeklyHours(record);
    if (weeklyHours >= EXCESSIVE_WEEKLY_HOURS) {
      anomalies.push({
        type: "EXCESSIVE_HOURS",
        record,
        description: `Weekly hours (${weeklyHours.toFixed(1)}) exceed 60-hour threshold (week ${record.week_ending})`,
      });
    }

    for (let d = 0; d < DAY_COLUMNS.length; d++) {
      const dayHours = getDayHours(record, d);
      if (dayHours >= EXCESSIVE_DAILY_HOURS) {
        anomalies.push({
          type: "EXCESSIVE_HOURS",
          record,
          description: `${DAY_NAMES[d]} has ${dayHours.toFixed(1)} hours (exceeds 10-hour limit) - week ${record.week_ending}`,
        });
      }
    }
  }

  return anomalies;
}

/** Group records by employee_id, sorted by week_ending. */
function groupByEmployeeSortedByWeek(
  records: PayrollRecord[]
): Map<number, PayrollRecord[]> {
  const byId = new Map<number, PayrollRecord[]>();
  for (const record of records) {
    const list = byId.get(record.employee_id) ?? [];
    list.push(record);
    byId.set(record.employee_id, list);
  }

  for (const list of byId.values()) {
    list.sort((a, b) =>
      parseWeekEnding(a.week_ending).getTime() -
      parseWeekEnding(b.week_ending).getTime()
    );
  }

  return byId;
}

/**
 * Run all anomaly detectors on payroll records.
 * @param records - Parsed payroll records (order does not matter)
 * @returns Array of detected anomalies
 */
export function detectAnomalies(records: PayrollRecord[]): Anomaly[] {
  const results: Anomaly[] = [];

  results.push(...detectNameIdMismatch(records));
  results.push(...detectRateChange(records));
  results.push(...detectLevelChange(records));
  results.push(...detectExcessiveHours(records));

  return results;
}
