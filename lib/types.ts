/**
 * Payroll record parsed from CSV data.
 */
export interface PayrollRecord {
  employee_name: string;
  employee_id: number;
  level: "APPRENTICE" | "JOURNEYWORKER";
  occupation: string;
  week_ending: string;
  mon_st_hours: number;
  tue_st_hours: number;
  wed_st_hours: number;
  thu_st_hours: number;
  fri_st_hours: number;
  sat_st_hours: number;
  sun_st_hours: number;
  mon_ot_hours: number;
  tue_ot_hours: number;
  wed_ot_hours: number;
  thu_ot_hours: number;
  fri_ot_hours: number;
  sat_ot_hours: number;
  sun_ot_hours: number;
  standard_rate: number;
  overtime_rate: number;
  benefits_rate: number;
}

/** Anomaly types detected in payroll data. */
export type AnomalyType =
  | "NAME_ID_MISMATCH"
  | "RATE_CHANGE"
  | "LEVEL_CHANGE"
  | "EXCESSIVE_HOURS";

/** A single detected anomaly, linked to a payroll record. */
export interface Anomaly {
  type: AnomalyType;
  record: PayrollRecord;
  description: string;
  /** Optional: previous value for comparison (e.g. prior rate, prior level). */
  previousValue?: string | number;
}
