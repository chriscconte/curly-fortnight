# Payroll Analytics

A Next.js app that visualizes payroll data and flags anomalies. Reads from `public/payroll_data.csv`.

**Approach:** Parse CSV → aggregate stats → rule-based anomaly detection. Summary dashboard, employee drill-down, and anomaly table. Recharts + Tailwind.

**Run:** `npm install && npm run dev`

---

**Questions**

- How should we handle multiple CSV files or date-range filters?
- Should anomaly thresholds (e.g. 25% rate change, 60h/week) be configurable?
- Export anomalies to CSV or integrate with a ticketing system?

**Trends**

This page shows trends in payroll over time, apprentice percentage, and anomaly count. It can be extended to show other temporal trends, such as hourly rates, benefits accrued, and other metrics. The idea is to provide a tracker for potential issues, progress towards goals, and areas for improvement.

**Custom Anomaly Detection**

This feature allows users to define custom anomaly rules. It is a work in progress, and the UI is not yet polished. The idea is to allow users to define their own anomaly rules, and to have a way to track and alert on them, without having to write code.


**Demo**

This is deployed on Vercel: https://curly-fortnight-nu.vercel.app/


**Improvements**

- Add a way to upload one or multiple CSV files. I chose not to implement this because I simply ran out of time, and it didn't seem like the most interesting feature to build.
- Add a persistent data store
- Add a way to download the anomalies as a CSV.
- Add a way to better filter the anomalies.
- Add a way to remove anomalies, and re calculate statistics. These anomalies could be a part of an issue-tracking system, where the issues are resolved, marked as false positives, assigned to the employee, etc.