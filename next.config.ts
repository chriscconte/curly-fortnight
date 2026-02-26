import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure payroll_data.csv is included in Vercel serverless bundle.
  // File tracing doesn't detect fs.readFileSync(path.join(...)) at build time.
  outputFileTracingIncludes: {
    "/**": ["public/payroll_data.csv"],
  },
};

export default nextConfig;
