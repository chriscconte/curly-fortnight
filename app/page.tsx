import fs from "fs";
import path from "path";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import type { PayrollRecord } from "@/lib/types";
import { HoursByDayChart } from "./components/HoursByDayChart";
import { PayrollByEmployeeChart } from "./components/PayrollByEmployeeChart";
import { ApprenticeVsJourneymanChart } from "./components/ApprenticeVsJourneymanChart";

function sumHours(r: PayrollRecord): number {
  const st =
    r.mon_st_hours +
    r.tue_st_hours +
    r.wed_st_hours +
    r.thu_st_hours +
    r.fri_st_hours +
    r.sat_st_hours +
    r.sun_st_hours;
  const ot =
    r.mon_ot_hours +
    r.tue_ot_hours +
    r.wed_ot_hours +
    r.thu_ot_hours +
    r.fri_ot_hours +
    r.sat_ot_hours +
    r.sun_ot_hours;
  return st + ot;
}

function parseWeekEnding(dateStr: string): Date {
  const [m, d, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateRange(min: Date, max: Date): string {
  return `${min.toLocaleDateString("en-US")} – ${max.toLocaleDateString("en-US")}`;
}

function payrollForRecord(r: PayrollRecord): number {
  const st =
    r.mon_st_hours +
    r.tue_st_hours +
    r.wed_st_hours +
    r.thu_st_hours +
    r.fri_st_hours +
    r.sat_st_hours +
    r.sun_st_hours;
  const ot =
    r.mon_ot_hours +
    r.tue_ot_hours +
    r.wed_ot_hours +
    r.thu_ot_hours +
    r.fri_ot_hours +
    r.sat_ot_hours +
    r.sun_ot_hours;
  const totalHours = st + ot;
  return (
    st * r.standard_rate +
    ot * r.overtime_rate +
    totalHours * r.benefits_rate
  );
}

export default async function SummaryPage() {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);

  const totalWorkforce = new Set(records.map((r) => r.employee_id)).size;
  const cumulativePayroll = records.reduce(
    (sum, r) => sum + payrollForRecord(r),
    0
  );
  const ratesByEmployee = new Map<number, number>();
  for (const r of records) {
    if (!ratesByEmployee.has(r.employee_id)) {
      ratesByEmployee.set(r.employee_id, r.standard_rate);
    }
  }
  const avgHourlyRate =
    ratesByEmployee.size > 0
      ? [...ratesByEmployee.values()].reduce((a, b) => a + b, 0) /
        ratesByEmployee.size
      : 0;
  const totalHours = records.reduce((sum, r) => sum + sumHours(r), 0);
  const apprenticeHours = records
    .filter((r) => r.level === "APPRENTICE")
    .reduce((sum, r) => sum + sumHours(r), 0);
  const apprenticeHoursPct =
    totalHours > 0 ? (apprenticeHours / totalHours) * 100 : 0;
  const journeymanHours = totalHours - apprenticeHours;

  const hoursByDay = [
    {
      day: "Mon",
      hours:
        records.reduce(
          (s, r) => s + r.mon_st_hours + r.mon_ot_hours,
          0
        ),
    },
    {
      day: "Tue",
      hours:
        records.reduce(
          (s, r) => s + r.tue_st_hours + r.tue_ot_hours,
          0
        ),
    },
    {
      day: "Wed",
      hours:
        records.reduce(
          (s, r) => s + r.wed_st_hours + r.wed_ot_hours,
          0
        ),
    },
    {
      day: "Thu",
      hours:
        records.reduce(
          (s, r) => s + r.thu_st_hours + r.thu_ot_hours,
          0
        ),
    },
    {
      day: "Fri",
      hours:
        records.reduce(
          (s, r) => s + r.fri_st_hours + r.fri_ot_hours,
          0
        ),
    },
    {
      day: "Sat",
      hours:
        records.reduce(
          (s, r) => s + r.sat_st_hours + r.sat_ot_hours,
          0
        ),
    },
    {
      day: "Sun",
      hours:
        records.reduce(
          (s, r) => s + r.sun_st_hours + r.sun_ot_hours,
          0
        ),
    },
  ];

  const payrollByEmployeeMap = new Map<number, { name: string; payroll: number }>();
  for (const r of records) {
    const pay = payrollForRecord(r);
    const existing = payrollByEmployeeMap.get(r.employee_id);
    if (existing) {
      existing.payroll += pay;
    } else {
      payrollByEmployeeMap.set(r.employee_id, {
        name: r.employee_name,
        payroll: pay,
      });
    }
  }
  const payrollByEmployee = [...payrollByEmployeeMap.values()]
    .sort((a, b) => b.payroll - a.payroll)
    .slice(0, 10);

  const apprenticeVsJourneyman = [
    { name: "Apprentice", value: apprenticeHours },
    { name: "Journeyman", value: journeymanHours },
  ];

  const weekEndings = records.map((r) => parseWeekEnding(r.week_ending));
  const dateRange =
    weekEndings.length > 0
      ? formatDateRange(
          new Date(Math.min(...weekEndings.map((d) => d.getTime()))),
          new Date(Math.max(...weekEndings.map((d) => d.getTime())))
        )
      : "—";

  const benefitsAccrued = records.reduce(
    (sum, r) => sum + r.benefits_rate * sumHours(r),
    0
  );

  const stats = [
    {
      label: "Total Workforce",
      value: totalWorkforce.toLocaleString(),
    },
    {
      label: "Cumulative Payroll",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(cumulativePayroll),
    },
    {
      label: "Average Hourly Rates",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(avgHourlyRate),
    },
    {
      label: "Apprentice Hours %",
      value: `${apprenticeHoursPct.toFixed(1)}%`,
    },
    {
      label: "Benefits Accrued",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(benefitsAccrued),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Summary
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Payroll overview from payroll data.
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        Date range: {dateRange}
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="flex min-w-[200px] flex-1 basis-[200px] flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </span>
            <span className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <HoursByDayChart data={hoursByDay} />
        <ApprenticeVsJourneymanChart data={apprenticeVsJourneyman} />
      </div>
      <div className="mt-6">
        <PayrollByEmployeeChart data={payrollByEmployee} />
      </div>
    </div>
  );
}
