import { Suspense } from "react";
import SensoryReportPageClient from "./SensoryReportPageClient";

interface SensoryReportPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = "force-dynamic";

export default function SensoryReportPage({
  searchParams,
}: SensoryReportPageProps) {
  return <SensoryReportPageClient />;
}
