"use client";

import { useState } from "react";
import type { AnomalyDefinition, AnomalyRule } from "@/lib/types";
import {
  NUMERIC_FIELDS,
  TEMPORAL_CATEGORICAL_FIELDS,
} from "@/lib/customAnomalyDetection";

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

const OPERATORS = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "=", label: "=" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "!=", label: "!=" },
] as const;

type RuleKind = AnomalyRule["kind"];

interface AnomalyDefinitionFormProps {
  initial?: AnomalyDefinition;
  onSave: (def: AnomalyDefinition) => void;
  onCancel: () => void;
}

export function AnomalyDefinitionForm({
  initial,
  onSave,
  onCancel,
}: AnomalyDefinitionFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<RuleKind>(
    initial?.rule.kind ?? "single_record"
  );
  const [field, setField] = useState(
    initial && "field" in initial.rule ? initial.rule.field : NUMERIC_FIELDS[0]
  );
  const [operator, setOperator] = useState<
    Extract<AnomalyRule, { kind: "single_record" }>["operator"]
  >(
    initial && initial.rule.kind === "single_record"
      ? initial.rule.operator
      : ">"
  );
  const [value, setValue] = useState<string>(
    initial && initial.rule.kind === "single_record"
      ? String(initial.rule.value)
      : "0"
  );
  const [thresholdPercent, setThresholdPercent] = useState(
    initial && initial.rule.kind === "temporal_percent"
      ? String(initial.rule.thresholdPercent)
      : "25"
  );
  const [temporalField, setTemporalField] = useState(
    initial && initial.rule.kind === "temporal_any_change"
      ? initial.rule.field
      : TEMPORAL_CATEGORICAL_FIELDS[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let rule: AnomalyRule;
    switch (kind) {
      case "single_record":
        rule = {
          kind: "single_record",
          field,
          operator,
          value: isNaN(Number(value)) ? value : Number(value),
        };
        break;
      case "temporal_percent":
        rule = {
          kind: "temporal_percent",
          field,
          thresholdPercent: Number(thresholdPercent) || 25,
        };
        break;
      case "temporal_any_change":
        rule = {
          kind: "temporal_any_change",
          field: temporalField,
        };
        break;
      case "cross_record":
        rule = { kind: "cross_record", type: "name_id_mismatch" };
        break;
    }

    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      rule,
      enabled: initial?.enabled ?? true,
    });
  };

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
    >
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. High weekly hours"
          className={`mt-1 block w-full ${inputClass}`}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Rule type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as RuleKind)}
          className={`mt-1 block w-full ${inputClass}`}
        >
          <option value="single_record">Single-record (field vs threshold)</option>
          <option value="temporal_percent">Temporal (% change from previous week)</option>
          <option value="temporal_any_change">Temporal (any change)</option>
          <option value="cross_record">Cross-record (name/ID mismatch)</option>
        </select>
      </div>

      {kind === "single_record" && (
        <>
          <div>
            <label className={labelClass}>Field</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className={`mt-1 block w-full ${inputClass}`}
            >
              {NUMERIC_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABELS[f] ?? f}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div>
              <label className={labelClass}>Operator</label>
              <select
                value={operator}
                onChange={(e) =>
                  setOperator(
                    e.target.value as Extract<
                      AnomalyRule,
                      { kind: "single_record" }
                    >["operator"]
                  )
                }
                className={`mt-1 block ${inputClass}`}
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelClass}>Value</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 50 or 30.5"
                className={`mt-1 block w-full ${inputClass}`}
              />
            </div>
          </div>
        </>
      )}

      {kind === "temporal_percent" && (
        <>
          <div>
            <label className={labelClass}>Numeric field</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className={`mt-1 block w-full ${inputClass}`}
            >
              {NUMERIC_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABELS[f] ?? f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Threshold (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={thresholdPercent}
              onChange={(e) => setThresholdPercent(e.target.value)}
              className={`mt-1 block w-full ${inputClass}`}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Flag when change from previous week exceeds this percentage
            </p>
          </div>
        </>
      )}

      {kind === "temporal_any_change" && (
        <div>
          <label className={labelClass}>Categorical field</label>
          <select
            value={temporalField}
            onChange={(e) =>
              setTemporalField(
                e.target.value as (typeof TEMPORAL_CATEGORICAL_FIELDS)[number]
              )
            }
            className={`mt-1 block w-full ${inputClass}`}
          >
            {TEMPORAL_CATEGORICAL_FIELDS.map((f) => (
              <option key={f} value={f}>
                {FIELD_LABELS[f] ?? f}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Flag when value changes from previous week
          </p>
        </div>
      )}

      {kind === "cross_record" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Detects when the same employee ID is associated with multiple names
          across records.
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {initial ? "Update" : "Add"} definition
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
