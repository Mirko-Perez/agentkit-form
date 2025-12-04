"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiService } from "../utils/api";

interface ReportPlanilla {
  report_id: string;
  evaluation_id: string;
  report_type: string;
  report_title: string;
  total_participants: number;
  region: string;
  country: string;
  project_name: string;
  report_year: number;
  report_month: number;
  report_month_name: string;
  generated_at: string;
  authorization_status: string;
  winning_formula_percentage: number | null;
  is_winning_formula: boolean | null;
  total_products: number | null;
}

export const ReportsPlanilla: React.FC = () => {
  const [reports, setReports] = useState<ReportPlanilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: "",
    region: "",
    country: "",
    project_name: "",
    month: "",
    year: new Date().getFullYear().toString(),
    authorization_status: ""
  });

  const regions = ["Perú", "Chile", "Venezuela", "España"];
  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getGeneratedReports({
        type: filters.type || undefined,
        region: filters.region || undefined,
        country: filters.country || undefined,
        project_name: filters.project_name || undefined,
        month: filters.month || undefined,
        year: filters.year || undefined,
        authorization_status: filters.authorization_status || undefined,
      });
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      region: "",
      country: "",
      project_name: "",
      month: "",
      year: new Date().getFullYear().toString(),
      authorization_status: ""
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status === "approved" ? "✅ Aprobado" : status === "rejected" ? "❌ Rechazado" : "⏳ Pendiente"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Planilla de Reportes
          </h1>
          <p className="text-gray-600">
            Tabla completa de reportes generados con filtros por región, proyecto y fecha
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="sensory">Evaluación Sensorial</option>
                <option value="survey">Encuesta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Región
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mes
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="2020"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Autorización
              </label>
              <select
                value={filters.authorization_status}
                onChange={(e) => setFilters({ ...filters, authorization_status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="approved">Aprobado</option>
                <option value="pending">Pendiente</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto
              </label>
              <input
                type="text"
                value={filters.project_name}
                onChange={(e) => setFilters({ ...filters, project_name: e.target.value })}
                placeholder="Ej: Solimar Boquillon"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando reportes...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No se encontraron reportes con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Reporte</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Región</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Proyecto</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Panelistas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Fecha</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Fórmula Ganadora</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{report.report_title}</div>
                        {report.total_products && (
                          <div className="text-sm text-gray-500">
                            {report.total_products} productos/SKUs
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.report_type === "sensory" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {report.report_type === "sensory" ? "Sensorial" : "Encuesta"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{report.region || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-700">{report.project_name || "N/A"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{report.total_participants}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {new Date(report.generated_at).toLocaleDateString("es-ES")}
                        <div className="text-xs text-gray-500">{report.report_month_name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {report.winning_formula_percentage !== null ? (
                          <div>
                            <span className={`font-bold ${
                              report.is_winning_formula ? "text-green-600" : "text-orange-600"
                            }`}>
                              {report.winning_formula_percentage.toFixed(1)}%
                            </span>
                            {report.is_winning_formula && (
                              <div className="text-xs text-green-600">✅ Cumple umbral</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(report.authorization_status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={
                            report.report_type === "sensory"
                              ? `/sensory-reports/${report.evaluation_id}`
                              : `/reports/${report.evaluation_id}`
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {reports.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Reportes</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {reports.filter(r => r.authorization_status === "approved").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Aprobados</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {reports.filter(r => r.authorization_status === "pending").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pendientes</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {reports.filter(r => r.is_winning_formula).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Fórmulas Ganadoras</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

