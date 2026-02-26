"use client";

import { useState } from "react";
import type { AnomalyDefinition, AnomalyRule } from "@/lib/types";
import { saveDefinitions } from "@/lib/anomalyDefinitionsStorage";
import { AnomalyDefinitionForm } from "./AnomalyDefinitionForm";

const FIELD_LABELS: Record<string, string> = {
  standard_rate: "Standard Rate",
  overtime_rate: "Overtime Rate",
  benefits_rate: "Benefits Rate",
  weekly_hours: "Weekly Hours",
  mon_hours: "Monday Hours",
  tue_hours: "Tuesday Hours",
  wed_hours: "Wednesday Hours",
  thu_hours: "Thursday Hours",
  fri_hours: "Friday Hours",
  sat_hours: "Saturday Hours",
  sun_hours: "Sunday Hours",
  level: "Level",
  occupation: "Occupation",
};

function ruleSummary(rule: AnomalyRule): string {
  switch (rule.kind) {
    case "single_record":
      return `${FIELD_LABELS[rule.field] ?? rule.field} ${rule.operator} ${rule.value}`;
    case "temporal_percent":
      return `${FIELD_LABELS[rule.field] ?? rule.field} change > ${rule.thresholdPercent}%`;
    case "temporal_any_change":
      return `${FIELD_LABELS[rule.field] ?? rule.field} changed`;
    case "cross_record":
      return "Name/ID mismatch";
  }
}

interface AnomalyDefinitionListProps {
  definitions: AnomalyDefinition[];
  onChange: (definitions: AnomalyDefinition[]) => void;
}

export function AnomalyDefinitionList({
  definitions,
  onChange,
}: AnomalyDefinitionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const handleSave = (def: AnomalyDefinition) => {
    const existing = definitions.findIndex((d) => d.id === def.id);
    let next: AnomalyDefinition[];
    if (existing >= 0) {
      next = [...definitions];
      next[existing] = def;
    } else {
      next = [...definitions, def];
    }
    onChange(next);
    saveDefinitions(next);
    setEditingId(null);
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    const next = definitions.filter((d) => d.id !== id);
    onChange(next);
    saveDefinitions(next);
    setEditingId(null);
  };

  const handleToggleEnabled = (id: string) => {
    const next = definitions.map((d) =>
      d.id === id ? { ...d, enabled: !d.enabled } : d
    );
    onChange(next);
    saveDefinitions(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Custom anomaly definitions
        </h3>
        {!adding && !editingId && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Add definition
          </button>
        )}
      </div>

      {adding && (
        <AnomalyDefinitionForm
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      )}

      {definitions.length === 0 && !adding ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No custom definitions. Add one to detect anomalies based on your own
          rules.
        </p>
      ) : (
        <ul className="space-y-2">
          {definitions.map((def) => (
            <li
              key={def.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {editingId === def.id ? (
                <div className="w-full">
                  <AnomalyDefinitionForm
                    initial={def}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={def.enabled}
                      onChange={() => handleToggleEnabled(def.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-800"
                      title={def.enabled ? "Disable" : "Enable"}
                      aria-label={`${def.enabled ? "Disable" : "Enable"} ${def.name}`}
                    />
                    <div>
                      <span
                        className={`font-medium ${
                          def.enabled
                            ? "text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {def.name}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {ruleSummary(def.rule)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(def.id)}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(def.id)}
                      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
