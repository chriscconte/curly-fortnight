import type { PayrollRecord } from "./types";

const INTEGER_COLUMNS = new Set(["employee_id"]);
const FLOAT_COLUMNS = new Set([
  "mon_st_hours",
  "tue_st_hours",
  "wed_st_hours",
  "thu_st_hours",
  "fri_st_hours",
  "sat_st_hours",
  "sun_st_hours",
  "mon_ot_hours",
  "tue_ot_hours",
  "wed_ot_hours",
  "thu_ot_hours",
  "fri_ot_hours",
  "sat_ot_hours",
  "sun_ot_hours",
  "standard_rate",
  "overtime_rate",
  "benefits_rate",
]);

/**
 * Parses a CSV line, handling quoted fields that may contain commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parses CSV text into an array of PayrollRecord objects.
 * @param csvText - Raw CSV string content
 * @returns Array of typed payroll records
 */
export function parsePayrollCsv(csvText: string): PayrollRecord[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const records: PayrollRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);

    if (values.length !== headers.length) {
      continue;
    }

    const record: Record<string, string | number> = {};

    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      const value = values[j];

      if (INTEGER_COLUMNS.has(key)) {
        record[key] = parseInt(value, 10) || 0;
      } else if (FLOAT_COLUMNS.has(key)) {
        record[key] = parseFloat(value) || 0;
      } else {
        record[key] = value ?? "";
      }
    }

    records.push(record as unknown as PayrollRecord);
  }

  return records;
}
