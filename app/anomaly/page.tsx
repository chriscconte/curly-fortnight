import fs from "fs";
import path from "path";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import { detectAnomalies } from "@/lib/anomaly-detection";
import { AnomalyTable } from "./AnomalyTable";

export default async function AnomalyPage() {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);
  const anomalies = detectAnomalies(records);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Anomaly Detection
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Detected anomalies in payroll data: name/ID mismatches, rate changes,
        level changes, and excessive hours.
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        {anomalies.length} anomaly(ies) found
      </p>
      <AnomalyTable anomalies={anomalies} />
    </div>
  );
}
