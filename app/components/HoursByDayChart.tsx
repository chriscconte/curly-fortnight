"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { day: string; hours: number }[];
}

export function HoursByDayChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Hours by Day of Week
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-700"
          />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
