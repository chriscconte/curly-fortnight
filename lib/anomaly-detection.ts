import type { Anomaly, PayrollRecord } from "./types";

const RATE_CHANGE_THRESHOLD = 0.25; // 25%
const EXCESSIVE_WEEKLY_HOURS = 60;
const MAX_DAILY_HOURS = 8;
const MAX_DAILY_HOURS_WITH_OVERTIME = 12;
const MIN_WEEKDAY_HOURS = 4;
const MIN_WEEKLY_HOURS = 30;

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

/** Get standard hours for a single day. */
function getStandardHours(record: PayrollRecord, dayIndex: number): number {
  const st = DAY_COLUMNS[dayIndex][0] as keyof PayrollRecord;
  return record[st] as number ?? 0;
}

/** Get overtime hours for a single day. */
function getOvertimeHours(record: PayrollRecord, dayIndex: number): number {
  const ot = DAY_COLUMNS[dayIndex][1] as keyof PayrollRecord;
  return record[ot] as number ?? 0;
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
            description: `${label} rate ${direction} (${(100*currRate/prevRate).toFixed(0)}%) from \$${prevRate.toFixed(2)} to \$${currRate.toFixed(2)}`,
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

/** Detect occupation change: employee switches to a different occupation. */
function detectOccupationChange(records: PayrollRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byEmployee = groupByEmployeeSortedByWeek(records);

  for (const [, employeeRecords] of byEmployee) {
    for (let i = 1; i < employeeRecords.length; i++) {
      const prev = employeeRecords[i - 1];
      const curr = employeeRecords[i];

      const prevOcc = prev.occupation.trim();
      const currOcc = curr.occupation.trim();
      if (prevOcc !== currOcc) {
        anomalies.push({
          type: "OCCUPATION_CHANGE",
          record: curr,
          description: `Occupation changed from ${prevOcc} to ${currOcc} (week ${curr.week_ending})`,
          previousValue: prevOcc,
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
    if (weeklyHours > EXCESSIVE_WEEKLY_HOURS) {
      anomalies.push({
        type: "EXCESSIVE_WEEKLY_HOURS",
        record,
        description: `Weekly hours (${weeklyHours.toFixed(1)}) exceed ${EXCESSIVE_WEEKLY_HOURS}-hour threshold`,
      });
    }

    for (let d = 0; d < DAY_COLUMNS.length; d++) {
      const standardHours = getStandardHours(record, d);
      const overtimeHours = getOvertimeHours(record, d);
      if (standardHours > MAX_DAILY_HOURS) {
        anomalies.push({
          type: "EXCESSIVE_STANDARD_HOURS",
          record,
          description: `${DAY_NAMES[d]} has ${standardHours.toFixed(1)} hours (exceeds ${MAX_DAILY_HOURS}-hour limit)`,
        }); 
      }
      const dailyHours = standardHours + overtimeHours;
      if (dailyHours > MAX_DAILY_HOURS_WITH_OVERTIME) {
        anomalies.push({
          type: "EXCESSIVE_DAILY_HOURS",
          record,
          description: `${DAY_NAMES[d]} has ${dailyHours.toFixed(1)} hours (exceeds ${MAX_DAILY_HOURS_WITH_OVERTIME}-hour limit)`,
        });
      }
    }
  }

  return anomalies;
}

/** Get total hours for a single day (standard + overtime). */
function getDailyHours(record: PayrollRecord, dayIndex: number): number {
  return getStandardHours(record, dayIndex) + getOvertimeHours(record, dayIndex);
}

/** Detect low hours: < 4 hours on a weekday, or < 30 hours in a week. */
function detectLowHours(records: PayrollRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const record of records) {
    const weeklyHours = getWeeklyHours(record);
    if (weeklyHours > 0 && weeklyHours < MIN_WEEKLY_HOURS) {
      anomalies.push({
        type: "LOW_WEEKLY_HOURS",
        record,
        description: `Weekly hours (${weeklyHours.toFixed(1)}) below ${MIN_WEEKLY_HOURS}-hour threshold`,
      });
    }

    // Weekdays are Mon–Fri (indices 0–4)
    for (let d = 0; d < 5; d++) {
      const dailyHours = getDailyHours(record, d);
      if (dailyHours > 0 && dailyHours < MIN_WEEKDAY_HOURS) {
        anomalies.push({
          type: "LOW_DAY_HOURS",
          record,
          description: `${DAY_NAMES[d]} has ${dailyHours.toFixed(1)} hours (below ${MIN_WEEKDAY_HOURS}-hour minimum for weekday)`,
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
  results.push(...detectOccupationChange(records));
  results.push(...detectExcessiveHours(records));
  results.push(...detectLowHours(records));

  return results;
}
