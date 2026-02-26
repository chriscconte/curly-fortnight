import type { PayrollRecord } from "./types";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type DayKey = (typeof DAYS)[number];

function hoursForDay(r: PayrollRecord, day: DayKey): number {
  const stKey = `${day}_st_hours` as keyof PayrollRecord;
  const otKey = `${day}_ot_hours` as keyof PayrollRecord;
  return (r[stKey] as number) + (r[otKey] as number);
}

export function sumHours(r: PayrollRecord): number {
  return DAYS.reduce((sum, day) => sum + hoursForDay(r, day), 0);
}

function getStAndOt(r: PayrollRecord): { st: number; ot: number } {
  let st = 0;
  let ot = 0;
  for (const day of DAYS) {
    const stKey = `${day}_st_hours` as keyof PayrollRecord;
    const otKey = `${day}_ot_hours` as keyof PayrollRecord;
    st += r[stKey] as number;
    ot += r[otKey] as number;
  }
  return { st, ot };
}

export function payrollForRecord(r: PayrollRecord): number {
  const { st, ot } = getStAndOt(r);
  const totalHours = st + ot;
  return (
    st * r.standard_rate +
    ot * r.overtime_rate +
    totalHours * r.benefits_rate
  );
}

function parseWeekEnding(dateStr: string): Date {
  const [m, d, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateRange(min: Date, max: Date): string {
  return `${min.toLocaleDateString("en-US")} – ${max.toLocaleDateString("en-US")}`;
}

export interface PayrollSummary {
  totalWorkforce: number;
  cumulativePayroll: number;
  avgHourlyRate: number;
  totalHours: number;
  apprenticeHours: number;
  apprenticeHoursPct: number;
  journeymanHours: number;
  hoursByDay: { day: string; hours: number }[];
  payrollByEmployee: { name: string; payroll: number }[];
  apprenticeVsJourneyman: { name: string; value: number }[];
  dateRange: string;
  benefitsAccrued: number;
}

export function aggregatePayroll(records: PayrollRecord[]): PayrollSummary {
  const employeeIds = new Set<number>();
  let cumulativePayroll = 0;
  const ratesByEmployee = new Map<number, number>();
  let totalHours = 0;
  let apprenticeHours = 0;
  const hoursByDayAccum = [0, 0, 0, 0, 0, 0, 0];
  const payrollByEmployeeMap = new Map<
    number,
    { name: string; payroll: number }
  >();
  let minWeekEnding = Infinity;
  let maxWeekEnding = -Infinity;
  let benefitsAccrued = 0;

  for (const r of records) {
    employeeIds.add(r.employee_id);

    const pay = payrollForRecord(r);
    cumulativePayroll += pay;

    if (!ratesByEmployee.has(r.employee_id)) {
      ratesByEmployee.set(r.employee_id, r.standard_rate);
    }

    const recordHours = sumHours(r);
    totalHours += recordHours;

    if (r.level === "APPRENTICE") {
      apprenticeHours += recordHours;
    }

    for (let i = 0; i < DAYS.length; i++) {
      hoursByDayAccum[i] += hoursForDay(r, DAYS[i]);
    }

    const existing = payrollByEmployeeMap.get(r.employee_id);
    if (existing) {
      existing.payroll += pay;
    } else {
      payrollByEmployeeMap.set(r.employee_id, {
        name: r.employee_name,
        payroll: pay,
      });
    }

    const weekEnding = parseWeekEnding(r.week_ending).getTime();
    minWeekEnding = Math.min(minWeekEnding, weekEnding);
    maxWeekEnding = Math.max(maxWeekEnding, weekEnding);

    benefitsAccrued += r.benefits_rate * recordHours;
  }

  const avgHourlyRate =
    ratesByEmployee.size > 0
      ? [...ratesByEmployee.values()].reduce((a, b) => a + b, 0) /
        ratesByEmployee.size
      : 0;

  const apprenticeHoursPct =
    totalHours > 0 ? (apprenticeHours / totalHours) * 100 : 0;
  const journeymanHours = totalHours - apprenticeHours;

  const hoursByDay = DAY_LABELS.map((day, i) => ({
    day,
    hours: hoursByDayAccum[i],
  }));

  const payrollByEmployee = [...payrollByEmployeeMap.values()]
    .sort((a, b) => b.payroll - a.payroll)
    .slice(0, 10);

  const apprenticeVsJourneyman = [
    { name: "Apprentice", value: apprenticeHours },
    { name: "Journeyman", value: journeymanHours },
  ];

  const dateRange =
    records.length > 0
      ? formatDateRange(new Date(minWeekEnding), new Date(maxWeekEnding))
      : "—";

  return {
    totalWorkforce: employeeIds.size,
    cumulativePayroll,
    avgHourlyRate,
    totalHours,
    apprenticeHours,
    apprenticeHoursPct,
    journeymanHours,
    hoursByDay,
    payrollByEmployee,
    apprenticeVsJourneyman,
    dateRange,
    benefitsAccrued,
  };
}
