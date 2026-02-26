import type {
  Anomaly,
  AnomalyDefinition,
  AnomalyRule,
  PayrollRecord,
} from "./types";

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

export const NUMERIC_FIELDS = [
  "standard_rate",
  "overtime_rate",
  "benefits_rate",
  "weekly_hours",
  "mon_hours",
  "tue_hours",
  "wed_hours",
  "thu_hours",
  "fri_hours",
  "sat_hours",
  "sun_hours",
] as const;

export const TEMPORAL_CATEGORICAL_FIELDS = ["level", "occupation"] as const;

/** Get computed fields for a record (weekly_hours, mon_hours..sun_hours). */
export function getComputedFields(record: PayrollRecord): Record<string, number> {
  const result: Record<string, number> = {};
  let weeklyHours = 0;
  for (let d = 0; d < DAY_COLUMNS.length; d++) {
    const st = DAY_COLUMNS[d][0] as keyof PayrollRecord;
    const ot = DAY_COLUMNS[d][1] as keyof PayrollRecord;
    const dayHours = (record[st] as number ?? 0) + (record[ot] as number ?? 0);
    result[`${DAY_NAMES[d].toLowerCase().slice(0, 3)}_hours`] = dayHours;
    weeklyHours += dayHours;
  }
  result.weekly_hours = weeklyHours;
  return result;
}

/** Get field value from record (including computed fields). */
function getFieldValue(
  record: PayrollRecord,
  field: string
): number | string | undefined {
  const computed = getComputedFields(record);
  if (field in computed) {
    return computed[field];
  }
  const key = field as keyof PayrollRecord;
  if (key in record) {
    return record[key] as number | string;
  }
  return undefined;
}

/** Parse week_ending (MM/DD/YYYY) to Date for sorting. */
function parseWeekEnding(weekEnding: string): Date {
  const [month, day, year] = weekEnding.split("/").map(Number);
  return new Date(year, month - 1, day);
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
    list.sort(
      (a, b) =>
        parseWeekEnding(a.week_ending).getTime() -
        parseWeekEnding(b.week_ending).getTime()
    );
  }
  return byId;
}

type SingleRecordOperator = ">" | "<" | "=" | ">=" | "<=" | "!=";

function compareValues(
  a: number | string,
  b: number | string,
  operator: SingleRecordOperator
): boolean {
  const numA = typeof a === "number" ? a : parseFloat(String(a));
  const numB = typeof b === "number" ? b : parseFloat(String(b));
  if (operator === "=" || operator === "!=") {
    const eq = a === b || (typeof a === "number" && typeof b === "number" && numA === numB);
    return operator === "=" ? eq : !eq;
  }
  if (typeof a !== "number" || typeof b !== "number") {
    return false;
  }
  switch (operator) {
    case ">":
      return a > b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    default:
      return false;
  }
}

function executeSingleRecordRule(
  records: PayrollRecord[],
  rule: Extract<AnomalyRule, { kind: "single_record" }>,
  definitionId: string,
  definitionName: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  for (const record of records) {
    const value = getFieldValue(record, rule.field);
    if (value === undefined) continue;
    if (compareValues(value, rule.value, rule.operator)) {
      const displayValue =
        typeof value === "number" ? value.toFixed(2) : String(value);
      anomalies.push({
        type: "CUSTOM",
        record,
        description: `${rule.field} (${displayValue}) ${rule.operator} ${rule.value}`,
        definitionId,
        customTypeName: definitionName,
      });
    }
  }
  return anomalies;
}

function executeTemporalPercentRule(
  records: PayrollRecord[],
  rule: Extract<AnomalyRule, { kind: "temporal_percent" }>,
  definitionId: string,
  definitionName: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byEmployee = groupByEmployeeSortedByWeek(records);
  const threshold = rule.thresholdPercent / 100;

  for (const [, employeeRecords] of byEmployee) {
    for (let i = 1; i < employeeRecords.length; i++) {
      const prev = employeeRecords[i - 1];
      const curr = employeeRecords[i];
      const prevVal = getFieldValue(prev, rule.field);
      const currVal = getFieldValue(curr, rule.field);
      if (
        typeof prevVal !== "number" ||
        typeof currVal !== "number" ||
        prevVal <= 0
      )
        continue;
      const change = Math.abs(currVal - prevVal) / prevVal;
      if (change > threshold) {
        const direction = currVal > prevVal ? "increased" : "decreased";
        const pct = ((currVal / prevVal) * 100).toFixed(0);
        anomalies.push({
          type: "CUSTOM",
          record: curr,
          description: `${rule.field} ${direction} (${pct}%) from ${prevVal.toFixed(2)} to ${currVal.toFixed(2)}`,
          previousValue: prevVal,
          definitionId,
          customTypeName: definitionName,
        });
      }
    }
  }
  return anomalies;
}

function executeTemporalAnyChangeRule(
  records: PayrollRecord[],
  rule: Extract<AnomalyRule, { kind: "temporal_any_change" }>,
  definitionId: string,
  definitionName: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byEmployee = groupByEmployeeSortedByWeek(records);

  for (const [, employeeRecords] of byEmployee) {
    for (let i = 1; i < employeeRecords.length; i++) {
      const prev = employeeRecords[i - 1];
      const curr = employeeRecords[i];
      const prevVal = String(getFieldValue(prev, rule.field) ?? "").trim();
      const currVal = String(getFieldValue(curr, rule.field) ?? "").trim();
      if (prevVal !== currVal) {
        anomalies.push({
          type: "CUSTOM",
          record: curr,
          description: `${rule.field} changed from ${prevVal} to ${currVal} (week ${curr.week_ending})`,
          previousValue: prevVal,
          definitionId,
          customTypeName: definitionName,
        });
      }
    }
  }
  return anomalies;
}

function executeCrossRecordRule(
  records: PayrollRecord[],
  rule: Extract<AnomalyRule, { kind: "cross_record" }>,
  definitionId: string,
  definitionName: string
): Anomaly[] {
  if (rule.type !== "name_id_mismatch") return [];
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
        type: "CUSTOM",
        record,
        description: `Employee ID ${id} is associated with multiple names: ${nameList}`,
        definitionId,
        customTypeName: definitionName,
      });
    }
  }
  return anomalies;
}

/**
 * Execute custom anomaly definitions on payroll records.
 * @param records - Parsed payroll records
 * @param definitions - User-defined anomaly definitions (only enabled ones run)
 * @returns Array of detected anomalies from custom rules
 */
export function executeCustomDefinitions(
  records: PayrollRecord[],
  definitions: AnomalyDefinition[]
): Anomaly[] {
  const results: Anomaly[] = [];
  for (const def of definitions) {
    if (!def.enabled) continue;
    switch (def.rule.kind) {
      case "single_record":
        results.push(
          ...executeSingleRecordRule(
            records,
            def.rule,
            def.id,
            def.name
          )
        );
        break;
      case "temporal_percent":
        results.push(
          ...executeTemporalPercentRule(
            records,
            def.rule,
            def.id,
            def.name
          )
        );
        break;
      case "temporal_any_change":
        results.push(
          ...executeTemporalAnyChangeRule(
            records,
            def.rule,
            def.id,
            def.name
          )
        );
        break;
      case "cross_record":
        results.push(
          ...executeCrossRecordRule(
            records,
            def.rule,
            def.id,
            def.name
          )
        );
        break;
    }
  }
  return results;
}
