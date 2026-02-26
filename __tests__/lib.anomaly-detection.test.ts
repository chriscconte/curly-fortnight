import { expect, test } from "vitest";
import { parsePayrollCsv, detectAnomalies } from "../lib";
import fs from "fs";
import path from "path";

test("detectAnomalies on real payroll data", () => {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csv = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csv);
  const anomalies = detectAnomalies(records);

  const byType = anomalies.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const nameMismatch = anomalies.filter((a) => a.type === "NAME_ID_MISMATCH");
  const rateChange = anomalies.filter((a) => a.type === "RATE_CHANGE");
  const levelChange = anomalies.filter((a) => a.type === "LEVEL_CHANGE");
  const excessiveHours = anomalies.filter((a) => a.type === "EXCESSIVE_HOURS");

  expect(nameMismatch.length).toBeGreaterThan(0);
  expect(rateChange.length).toBeGreaterThan(0);
  expect(excessiveHours.length).toBeGreaterThan(0);
  expect(levelChange.length).toBe(0);

  expect(nameMismatch.some((a) => a.record.employee_id === 1021)).toBe(true);
  expect(nameMismatch.some((a) => a.description.includes("Zander") || a.description.includes("Deanna"))).toBe(true);

  expect(rateChange.some((a) => a.record.employee_id === 1001)).toBe(true);
  expect(rateChange.some((a) => a.record.employee_id === 1000)).toBe(true);

  expect(excessiveHours.some((a) => a.description.includes("60"))).toBe(true);
  expect(excessiveHours.some((a) => a.description.includes("10-hour"))).toBe(true);
});
