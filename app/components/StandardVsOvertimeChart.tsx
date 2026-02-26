"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HoursChartPoint, HoursGroupBy } from "@/lib/employeeDetail";

interface Props {
  dataByDay: HoursChartPoint[];
  dataByWeek: HoursChartPoint[];
  dataByMonth: HoursChartPoint[];
}

const GROUP_OPTIONS: { value: HoursGroupBy; label: string }[] = [
  { value: "day", label: "By Day" },
  { value: "week", label: "By Week" },
  { value: "month", label: "By Month" },
];

export function StandardVsOvertimeChart({
  dataByDay,
  dataByWeek,
  dataByMonth,
}: Props) {
  const [groupBy, setGroupBy] = useState<HoursGroupBy>("week");

  const chartData =
    groupBy === "day" ? dataByDay : groupBy === "week" ? dataByWeek : dataByMonth;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Standard vs Overtime Hours
        </h3>
        <div className="flex gap-2">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGroupBy(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                groupBy === opt.value
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-700"
          />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined) => [
              `${(value ?? 0).toFixed(1)} hrs`,
              "",
            ]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="standardHours"
            name="Standard"
            stackId="hours"
            fill="#7dd3fc"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="overtimeHours"
            name="Overtime"
            stackId="hours"
            fill="#fda4af"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
