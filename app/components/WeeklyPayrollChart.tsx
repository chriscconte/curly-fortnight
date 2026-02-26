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

export function WeeklyPayrollChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Weekly Payroll
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
            tickFormatter={(v) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
                maximumFractionDigits: 0,
              }).format(v)
            }
          />
          <Tooltip
            formatter={(value: number | undefined) => [
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value ?? 0),
              "Payroll",
            ]}
            labelFormatter={(label) => `Week ending: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="payroll"
            stroke="#7dd3fc"
            strokeWidth={2}
            dot={{ fill: "#7dd3fc", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
