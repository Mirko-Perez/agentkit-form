import { Suspense } from "react";
import SensoryReportPageClient from "./SensoryReportPageClient";

interface SensoryReportPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SensoryReportPage({
  searchParams,
}: SensoryReportPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SensoryReportPageClient />
    </Suspense>
  );
}
