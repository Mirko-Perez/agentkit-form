import { Suspense } from "react";
import ReportPageClient from "./ReportPageClient";

export default function ReportPage() {
  // This page will be prerendered as empty HTML
  // The client component will handle data loading
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportPageClient />
    </Suspense>
  );
}
