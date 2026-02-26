import type { AnomalyDefinition } from "./types";

const STORAGE_KEY = "curly-fortnight-anomaly-definitions";

/**
 * Load anomaly definitions from localStorage.
 * Returns empty array if none stored or parse fails.
 */
export function loadDefinitions(): AnomalyDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidDefinition);
  } catch {
    return [];
  }
}

/**
 * Save anomaly definitions to localStorage.
 */
export function saveDefinitions(definitions: AnomalyDefinition[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions));
  } catch {
    // Ignore quota exceeded or other storage errors
  }
}

function isValidDefinition(obj: unknown): obj is AnomalyDefinition {
  if (!obj || typeof obj !== "object") return false;
  const d = obj as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.enabled === "boolean" &&
    d.rule != null &&
    typeof d.rule === "object"
  );
}
