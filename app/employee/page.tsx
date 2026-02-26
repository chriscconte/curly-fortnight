import fs from "fs";
import path from "path";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import { aggregateEmployeeStats } from "@/lib/aggregateEmployeeStats";

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const hours = (n: number) => n.toFixed(1);

function StatColumnHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      <div>{title}</div>
      <div className="mt-0.5 text-[10px] font-normal opacity-80">({subtitle})</div>
    </th>
  );
}

function HoursCell({ min, avg, max }: { min: number; avg: number; max: number }) {
  return (
    <td className="px-4 py-3 text-center">
      <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {hours(avg)}h avg
      </div>
      <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {hours(min)}h – {hours(max)}h
      </div>
    </td>
  );
}

function CurrencyCell({ min, avg, max }: { min: number; avg: number; max: number }) {
  return (
    <td className="px-4 py-3 text-center">
      <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {currency(avg)} avg
      </div>
      <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {currency(min)} – {currency(max)}
      </div>
    </td>
  );
}

export default async function EmployeePage() {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);
  const employees = aggregateEmployeeStats(records);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Employees
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Per-employee hours and wage rate statistics.
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Name
              </th>
              <StatColumnHeader title="Hours" subtitle="MIN/AVG/MAX" />
              <StatColumnHeader title="Standard Rate" subtitle="MIN/AVG/MAX" />
              <StatColumnHeader title="OT Rate" subtitle="MIN/AVG/MAX" />
              <StatColumnHeader title="Benefits Rate" subtitle="MIN/AVG/MAX" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {employees.map((e) => (
              <tr
                key={e.employeeId}
                className="text-zinc-900 dark:text-zinc-50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                  {e.employeeId}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {e.name}
                </td>
                <HoursCell
                  min={e.minHoursPerDay}
                  avg={e.avgHoursPerDay}
                  max={e.maxHoursPerDay}
                />
                <CurrencyCell
                  min={e.minStandardRate}
                  avg={e.avgStandardRate}
                  max={e.maxStandardRate}
                />
                <CurrencyCell
                  min={e.minOvertimeRate}
                  avg={e.avgOvertimeRate}
                  max={e.maxOvertimeRate}
                />
                <CurrencyCell
                  min={e.minBenefitsRate}
                  avg={e.avgBenefitsRate}
                  max={e.maxBenefitsRate}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
