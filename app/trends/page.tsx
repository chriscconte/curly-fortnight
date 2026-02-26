import fs from "fs";
import path from "path";
import { parsePayrollCsv } from "@/lib/parsePayrollCsv";
import { detectAnomalies } from "@/lib/anomaly-detection";
import { getWeeklyTrendsData } from "@/lib/aggregateWeeklyTrends";
import { WeeklyPayrollChart } from "../components/WeeklyPayrollChart";
import { WeeklyApprenticePctChart } from "../components/WeeklyApprenticePctChart";
import { WeeklyAnomalyCountChart } from "../components/WeeklyAnomalyCountChart";

export default async function TrendsPage() {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csvText);
  const anomalies = detectAnomalies(records);
  const trendData = getWeeklyTrendsData(records, anomalies);

  const dateRange =
    trendData.length > 0
      ? `${trendData[0].weekLabel} – ${trendData[trendData.length - 1].weekLabel}`
      : "—";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Trends
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Temporal trends in payroll and workforce composition.
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        Date range: {dateRange}
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <WeeklyPayrollChart data={trendData} />
        <WeeklyApprenticePctChart data={trendData} />
        <WeeklyAnomalyCountChart data={trendData} />
      </div>
    </div>
  );
}
