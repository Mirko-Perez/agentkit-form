import { Suspense } from "react";
import ReportPageClient from "./ReportPageClient";

interface ReportPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = "force-dynamic";

export default function ReportPage({ searchParams }: ReportPageProps) {
  console.log("ReportPage - searchParams:", searchParams);

  return <ReportPageClient />;
}
