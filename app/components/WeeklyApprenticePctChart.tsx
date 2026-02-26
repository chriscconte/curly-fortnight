"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyTrendPoint } from "@/lib/aggregateWeeklyTrends";

interface Props {
  data: WeeklyTrendPoint[];
}

export function WeeklyApprenticePctChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Weekly Apprentice Hours %
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-700"
          />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: number | undefined) => [
              `${(value ?? 0).toFixed(1)}%`,
              "Apprentice %",
            ]}
            labelFormatter={(label) => `Week ending: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="apprenticeHoursPct"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ fill: "#a78bfa", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
