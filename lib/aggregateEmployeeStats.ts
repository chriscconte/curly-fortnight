import type { PayrollRecord } from "./types";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAYS)[number];

function hoursForDay(r: PayrollRecord, day: DayKey): number {
  const stKey = `${day}_st_hours` as keyof PayrollRecord;
  const otKey = `${day}_ot_hours` as keyof PayrollRecord;
  return (r[stKey] as number) + (r[otKey] as number);
}

export interface EmployeeStats {
  employeeId: number;
  name: string;
  minHoursPerDay: number;
  maxHoursPerDay: number;
  avgHoursPerDay: number;
  minStandardRate: number;
  maxStandardRate: number;
  avgStandardRate: number;
  minOvertimeRate: number;
  maxOvertimeRate: number;
  avgOvertimeRate: number;
  minBenefitsRate: number;
  maxBenefitsRate: number;
  avgBenefitsRate: number;
}

interface EmployeeAccum {
  name: string;
  hoursPerDay: number[];
  standardRates: number[];
  overtimeRates: number[];
  benefitsRates: number[];
}

export function aggregateEmployeeStats(
  records: PayrollRecord[]
): EmployeeStats[] {
  const byEmployee = new Map<number, EmployeeAccum>();

  for (const r of records) {
    let acc = byEmployee.get(r.employee_id);
    if (!acc) {
      acc = {
        name: r.employee_name,
        hoursPerDay: [],
        standardRates: [],
        overtimeRates: [],
        benefitsRates: [],
      };
      byEmployee.set(r.employee_id, acc);
    }

    for (const day of DAYS) {
      acc.hoursPerDay.push(hoursForDay(r, day));
    }
    acc.standardRates.push(r.standard_rate);
    acc.overtimeRates.push(r.overtime_rate);
    acc.benefitsRates.push(r.benefits_rate);
  }

  return [...byEmployee.entries()]
    .sort(([a], [b]) => a - b)
    .map(([employeeId, acc]) => {
      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
      const nonZeroHours = acc.hoursPerDay.filter((h) => h > 0);
      const minNonZero = (arr: number[]) =>
        arr.length ? Math.min(...arr) : 0;
      const max = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);
      const avg = (arr: number[]) =>
        arr.length ? sum(arr) / arr.length : 0;

      return {
        employeeId,
        name: acc.name,
        minHoursPerDay: minNonZero(nonZeroHours),
        maxHoursPerDay: max(acc.hoursPerDay),
        avgHoursPerDay: avg(acc.hoursPerDay),
        minStandardRate: minNonZero(acc.standardRates),
        maxStandardRate: max(acc.standardRates),
        avgStandardRate: avg(acc.standardRates),
        minOvertimeRate: minNonZero(acc.overtimeRates),
        maxOvertimeRate: max(acc.overtimeRates),
        avgOvertimeRate: avg(acc.overtimeRates),
        minBenefitsRate: minNonZero(acc.benefitsRates),
        maxBenefitsRate: max(acc.benefitsRates),
        avgBenefitsRate: avg(acc.benefitsRates),
      };
    });
}
