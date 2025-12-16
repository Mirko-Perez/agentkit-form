"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SensoryReportComponent } from "../../components/SensoryReport";
import { SensoryReport } from "../../types/survey";
import { apiService } from "../../utils/api";

export default function ReportPageClient() {
  const searchParams = useSearchParams();
  const surveyId = searchParams?.get("id");

  const [report, setReport] = useState<SensoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  console.log("ReportPageClient - surveyId from searchParams:", surveyId);

  useEffect(() => {
    const loadReport = async () => {
      console.log("loadReport - surveyId:", surveyId);
      console.log("loadReport - !surveyId:", !surveyId);

      if (!surveyId) {
        setError("ID de evaluación no válido");
        setLoading(false);
        return;
      }

      try {
        // Try as sensory report first
        const reportData = await apiService.getSensoryReport(surveyId);
        setReport(reportData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el reporte"
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [surveyId]);

  const regenerateReport = async () => {
    if (!surveyId) return;

    setRegenerating(true);

    try {
      const reportData = await apiService.getSensoryReport(surveyId);
      setReport(reportData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al regenerar el reporte"
      );
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Generando Reporte
          </h2>
          <p className="text-gray-600">
            Analizando preferencias y calculando estadísticas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Error al Cargar Reporte
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No hay Datos
          </h2>
          <p className="text-gray-600 mb-6">
            No se encontraron datos para esta evaluación sensorial.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver al Panel de Control
          </Link>

          <button
            onClick={regenerateReport}
            disabled={regenerating}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {regenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Regenerando...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualizar Reporte
              </>
            )}
          </button>
        </div>
      </div>
      <SensoryReportComponent report={report} />
    </div>
  );
}
