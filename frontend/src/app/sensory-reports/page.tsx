import { Suspense } from "react";
import SensoryReportPageClient from "./SensoryReportPageClient";

export default function SensoryReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SensoryReportPageClient />
    </Suspense>
  );
}
