# Payroll Analytics

A Next.js app that visualizes payroll data and flags anomalies. Reads from `public/payroll_data.csv`.

**Approach:** Parse CSV → aggregate stats → rule-based anomaly detection. Summary dashboard, employee drill-down, and anomaly table. Recharts + Tailwind.

**Run:** `npm install && npm run dev`

---

**Questions**

- How should we handle multiple CSV files or date-range filters?
- Should anomaly thresholds (e.g. 25% rate change, 60h/week) be configurable?
- Export anomalies to CSV or integrate with a ticketing system?
**Improvements**

- Add a way to upload multiple CSV files
- Add a persistent data store
- Add a way to toggle between different data sets
- Add a way to download the anomalies as a CSV