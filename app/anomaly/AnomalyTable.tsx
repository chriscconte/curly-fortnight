"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Anomaly, AnomalyType } from "@/lib/types";

const typeLabels: Record<AnomalyType, string> = {
  NAME_ID_MISMATCH: "Name/ID Mismatch",
  RATE_CHANGE: "Rate Change",
  LEVEL_CHANGE: "Level Change",
  OCCUPATION_CHANGE: "Occupation Change",
  EXCESSIVE_STANDARD_HOURS: "Excessive Standard Hours",
  EXCESSIVE_DAILY_HOURS: "Excessive Standard + Overtime Hours",
  EXCESSIVE_WEEKLY_HOURS: "Excessive Weekly Hours",
  LOW_DAY_HOURS: "Low Day Hours",
  LOW_WEEKLY_HOURS: "Low Weekly Hours",
  CUSTOM: "Custom",
};

function getTypeDisplayName(a: Anomaly): string {
  if (a.type === "CUSTOM" && a.customTypeName) {
    return a.customTypeName;
  }
  return typeLabels[a.type];
}

const PAGE_SIZE = 10;

interface AnomalyTableProps {
  anomalies: Anomaly[];
}

export function AnomalyTable({ anomalies }: AnomalyTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const customTypeNames = useMemo(() => {
    const names = new Set<string>();
    for (const a of anomalies) {
      if (a.type === "CUSTOM" && a.customTypeName) {
        names.add(a.customTypeName);
      }
    }
    return [...names].sort();
  }, [anomalies]);

  const filtered = useMemo(() => {
    if (!typeFilter) return anomalies;
    if (typeLabels[typeFilter as AnomalyType]) {
      return anomalies.filter((a) => a.type === typeFilter);
    }
    return anomalies.filter((a) => a.customTypeName === typeFilter);
  }, [anomalies, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const goToPage = (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1)));

  if (anomalies.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
        No anomalies detected.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          Filter by type:
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">All</option>
            {(Object.keys(typeLabels) as AnomalyType[])
              .filter((t) => t !== "CUSTOM")
              .map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            {customTypeNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-zinc-500 dark:text-zinc-500">
          Showing {filtered.length} of {anomalies.length} anomaly(ies)
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Week Ending
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {paginated.map((a, i) => (
              <tr key={currentPage * PAGE_SIZE + i} className="text-zinc-900 dark:text-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                  {getTypeDisplayName(a)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <Link
                    href={`/employee/${a.record.employee_id}`}
                    className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    {a.record.employee_name} ({a.record.employee_id})
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {a.record.week_ending}
                </td>
                <td className="px-4 py-3 text-sm">{a.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(0)}
              disabled={currentPage === 0}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              First
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Next
            </button>
            <button
              onClick={() => goToPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
