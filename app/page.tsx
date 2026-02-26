import fs from "fs";
import path from "path";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import { aggregatePayroll } from "@/lib/aggregatePayroll";
import { HoursByDayChart } from "./components/HoursByDayChart";
import { PayrollByEmployeeChart } from "./components/PayrollByEmployeeChart";
import { ApprenticeVsJourneymanChart } from "./components/ApprenticeVsJourneymanChart";

export default async function SummaryPage() {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);
  const summary = aggregatePayroll(records);

  const stats = [
    {
      label: "Total Workforce",
      value: summary.totalWorkforce.toLocaleString(),
    },
    {
      label: "Cumulative Payroll",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(summary.cumulativePayroll),
    },
    {
      label: "Average Hourly Rates",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(summary.avgHourlyRate),
    },
    {
      label: "Apprentice Hours %",
      value: `${summary.apprenticeHoursPct.toFixed(1)}%`,
    },
    {
      label: "Benefits Accrued",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(summary.benefitsAccrued),
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
        Date range: {summary.dateRange}
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
        <HoursByDayChart data={summary.hoursByDay} />
        <ApprenticeVsJourneymanChart data={summary.apprenticeVsJourneyman} />
      </div>
      <div className="mt-6">
        <PayrollByEmployeeChart data={summary.payrollByEmployee} />
      </div>
    </div>
  );
}
