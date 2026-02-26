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

const hours = (n: number) => n.toFixed(2);

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
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Min hrs/day (non-zero)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Max hrs/day
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Avg hrs/day
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Min std rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Max std rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Avg std rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Min OT rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Max OT rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Avg OT rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Min benefits rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Max benefits rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Avg benefits rate
              </th>
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
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {hours(e.minHoursPerDay)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {hours(e.maxHoursPerDay)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {hours(e.avgHoursPerDay)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.minStandardRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.maxStandardRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.avgStandardRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.minOvertimeRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.maxOvertimeRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.avgOvertimeRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.minBenefitsRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.maxBenefitsRate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                  {currency(e.avgBenefitsRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
