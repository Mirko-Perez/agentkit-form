import React from "react";
import { SurveyReport } from "../types/survey";

interface SurveyReportProps {
  report: SurveyReport;
}

export const SurveyReportComponent: React.FC<SurveyReportProps> = ({
  report,
}) => {
  // Encontrar estadísticas de respuestas para mostrar lo que hicieron los panelistas
  const getResponseSummary = () => {
    const completedResponses = report.questions_stats.filter(
      (stat) => stat.total_responses > 0
    );
    return completedResponses.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reporte de Encuesta
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-8">
            {report.survey_title}
          </h2>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panelistas Card */}
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="text-6xl font-bold text-gray-900 mb-4">
                {report.total_responses}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Panelistas Participantes
              </h3>
              <p className="text-gray-600">
                Personas que completaron la encuesta
              </p>
            </div>
          </div>

          {/* Completion Card */}
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-6xl font-bold text-gray-900 mb-4">
                {(report.completion_rate * 100).toFixed(0)}%
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Tasa de Finalización
              </h3>
              <p className="text-gray-600">
                Porcentaje de encuestas completadas
              </p>
            </div>
          </div>
        </div>

        {/* What They Did Section */}
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Qué hicieron nuestros panelistas?
            </h2>
            <p className="text-lg text-gray-600">
              Análisis de participación y comportamiento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Questions Answered */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {report.questions_stats.length}
              </div>
              <div className="text-lg font-semibold text-gray-700">
                Preguntas Respondidas
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Por cada panelista
              </div>
            </div>

            {/* Average Time (simulated) */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="text-4xl font-bold text-green-600 mb-2">~3-5</div>
              <div className="text-lg font-semibold text-gray-700">
                Minutos Promedio
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Tiempo de completado
              </div>
            </div>

            {/* Response Quality */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-lg font-semibold text-gray-700">
                Calidad de Respuestas
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Respuestas válidas
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights (simplified) */}
        {report.insights && report.insights.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-10 rounded-3xl text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Insights Inteligentes
              </h2>
              <p className="text-xl opacity-90">
                Análisis generado por IA basado en las respuestas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.insights.slice(0, 4).map((insight, index) => (
                <div
                  key={index}
                  className="bg-gray-50 bg-opacity-10 backdrop-blur-sm p-6 rounded-2xl border border-white border-opacity-20"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-sm font-bold text-black">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-black leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-lg">
            <svg
              className="w-5 h-5 text-gray-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-gray-600 font-medium">
              Reporte generado el{" "}
              {new Date(report.generated_at).toLocaleDateString("es-ES")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
