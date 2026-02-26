import fs from "fs";
import path from "path";
import Link from "next/link";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import { aggregateEmployeeStats } from "@/lib/aggregateEmployeeStats";

const PAGE_SIZE = 10;

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const hours = (n: number) => n.toFixed(1);

function formatLevel(level: "APPRENTICE" | "JOURNEYWORKER"): string {
  return level === "JOURNEYWORKER" ? "Journeyman" : "Apprentice";
}

function TradeAndClassCell({
  occupation,
  level,
}: {
  occupation: string;
  level: "APPRENTICE" | "JOURNEYWORKER";
}) {
  return (
    <td className="px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {occupation}
        </span>
        <span className="inline-flex w-fit rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-zinc-700 dark:text-blue-400">
          {formatLevel(level)}
        </span>
      </div>
    </td>
  );
}

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

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing {start}–{end} of {totalItems} employees
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Link
          href={currentPage > 1 ? `/employee?page=${currentPage - 1}` : "#"}
          className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            currentPage <= 1
              ? "pointer-events-none text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          aria-disabled={currentPage <= 1}
        >
          Previous
        </Link>
        <span className="mx-2 flex items-center gap-1">
          {(() => {
            const maxVisible = 7;
            const pages: (number | "ellipsis")[] = [];
            if (totalPages <= maxVisible) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              const half = Math.floor(maxVisible / 2);
              const start = Math.max(2, Math.min(currentPage - half, totalPages - maxVisible + 2));
              const end = Math.min(totalPages - 1, start + maxVisible - 3);
              pages.push(1);
              if (start > 2) pages.push("ellipsis");
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages - 1) pages.push("ellipsis");
              if (totalPages > 1) pages.push(totalPages);
            }
            return pages.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-zinc-500">
                  …
                </span>
              ) : p === currentPage ? (
                <span
                  key={p}
                  className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white"
                >
                  {p}
                </span>
              ) : (
                <Link
                  key={p}
                  href={`/employee?page=${p}`}
                  className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {p}
                </Link>
              )
            );
          })()}
        </span>
        <Link
          href={
            currentPage < totalPages ? `/employee?page=${currentPage + 1}` : "#"
          }
          className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            currentPage >= totalPages
              ? "pointer-events-none text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          aria-disabled={currentPage >= totalPages}
        >
          Next
        </Link>
      </nav>
    </div>
  );
}

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);
  const allEmployees = aggregateEmployeeStats(records);

  const totalPages = Math.max(1, Math.ceil(allEmployees.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const employees = allEmployees.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span className="block">Trade &</span>
                <span className="block">Class</span>
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
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <Link
                    href={`/employee/${e.employeeId}`}
                    className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    {e.name}
                  </Link>
                </td>
                <TradeAndClassCell occupation={e.occupation} level={e.level} />
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
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={allEmployees.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
