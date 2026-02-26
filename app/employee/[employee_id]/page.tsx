import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import { detectAnomalies } from "@/lib/anomaly-detection";
import {
  getEmployeeDetail,
  getEmployeeHoursChartData,
} from "@/lib/employeeDetail";
import { StandardVsOvertimeChart } from "@/app/components/StandardVsOvertimeChart";
import { AnomalyTable } from "@/app/anomaly/AnomalyTable";

interface Props {
  params: Promise<{ employee_id: string }>;
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { employee_id } = await params;
  const employeeId = parseInt(employee_id, 10);
  if (Number.isNaN(employeeId)) notFound();

  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);
  const anomalies = detectAnomalies(records);

  const detail = getEmployeeDetail(records, anomalies, employeeId);
  if (!detail) notFound();

  const dataByDay = getEmployeeHoursChartData(records, employeeId, "day");
  const dataByWeek = getEmployeeHoursChartData(records, employeeId, "week");
  const dataByMonth = getEmployeeHoursChartData(records, employeeId, "month");

  const formatLevel = (level: string) =>
    level === "JOURNEYWORKER" ? "Journeyman" : "Apprentice";

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/employee"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          ← Back to Employees
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {detail.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        ID {detail.employeeId} · {detail.occupation} ·{" "}
        {formatLevel(detail.level)}
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex min-w-[180px] flex-1 basis-[180px] flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Hours
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {detail.totalHours.toFixed(1)}h
          </span>
        </div>
        <div className="flex min-w-[180px] flex-1 basis-[180px] flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Overtime Hours
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {detail.totalOvertimeHours.toFixed(1)}h
          </span>
        </div>
        <div className="flex min-w-[180px] flex-1 basis-[180px] flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Anomaly Count
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {detail.anomalies.length}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <StandardVsOvertimeChart
          dataByDay={dataByDay}
          dataByWeek={dataByWeek}
          dataByMonth={dataByMonth}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Anomalies
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Anomalies associated with this employee.
        </p>
        <AnomalyTable anomalies={detail.anomalies} />
      </div>
    </div>
  );
}
