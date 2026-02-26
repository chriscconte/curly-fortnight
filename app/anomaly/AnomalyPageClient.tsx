"use client";

import { useState, useEffect, useMemo } from "react";
import type { Anomaly, AnomalyDefinition, PayrollRecord } from "@/lib/types";
import { executeCustomDefinitions } from "@/lib/customAnomalyDetection";
import { loadDefinitions } from "@/lib/anomalyDefinitionsStorage";
import { AnomalyTable } from "./AnomalyTable";
import { AnomalyDefinitionList } from "./AnomalyDefinitionList";

interface AnomalyPageClientProps {
  records: PayrollRecord[];
  builtInAnomalies: Anomaly[];
}

export function AnomalyPageClient({
  records,
  builtInAnomalies,
}: AnomalyPageClientProps) {
  const [definitions, setDefinitions] = useState<AnomalyDefinition[]>([]);

  useEffect(() => {
    setDefinitions(loadDefinitions());
  }, []);

  const customAnomalies = useMemo(
    () => executeCustomDefinitions(records, definitions),
    [records, definitions]
  );

  const allAnomalies = useMemo(
    () => [...builtInAnomalies, ...customAnomalies],
    [builtInAnomalies, customAnomalies]
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Define custom rules
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Create anomaly types with your own thresholds and rules. Definitions
          are saved in your browser.
        </p>
        <div className="mt-4">
          <AnomalyDefinitionList
            definitions={definitions}
            onChange={setDefinitions}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Detected anomalies
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          {allAnomalies.length} anomaly(ies) found
        </p>
        <AnomalyTable anomalies={allAnomalies} />
      </section>
    </div>
  );
}
