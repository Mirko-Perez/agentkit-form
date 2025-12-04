import React from "react";
import { SensoryReport } from "../types/survey";

interface SensoryReportProps {
  report: SensoryReport;
}

export const SensoryReportComponent: React.FC<SensoryReportProps> = ({
  report,
}) => {
  const sortedByPreference = [...report.preference_analysis].sort(
    (a, b) => b.percentage - a.percentage
  );

  const topProducts = sortedByPreference.slice(0, 2);

  const getProductMeta = (productId: string) =>
    report.products.find((p) => p.id === productId);

  const getProductFeedback = (productId: string) =>
    report.qualitative_feedback.product_specific_feedback?.find(
      (p) => p.product_id === productId
    );

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "from-yellow-400 to-yellow-600"; // Gold for 1st
      case 2:
        return "from-gray-300 to-gray-500"; // Silver for 2nd
      case 3:
        return "from-orange-400 to-orange-600"; // Bronze for 3rd
      default:
        return "from-blue-400 to-blue-600";
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-white"
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Reporte de Evaluación Sensorial
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-8">
            {report.evaluation_title}
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {report.total_panelists}
            </div>
            <div className="text-gray-600 font-medium">Panelistas</div>
            <div className="text-sm text-gray-500">Participantes totales</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {report.total_evaluations}
            </div>
            <div className="text-gray-600 font-medium">Evaluaciones</div>
            <div className="text-sm text-gray-500">Completadas</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {report.products.length}
            </div>
            <div className="text-gray-600 font-medium">Productos</div>
            <div className="text-sm text-gray-500">En comparación</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center">
            <div
              className={`text-4xl font-bold mb-2 ${
                report.statistical_analysis.overall_significance
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {report.statistical_analysis.overall_significance ? "SÍ" : "NO"}
            </div>
            <div className="text-gray-600 font-medium">Diferencias</div>
            <div className="text-sm text-gray-500">Significativas</div>
          </div>
        </div>

        {/* Paired Preference Summary (Slide-style view) */}
        {topProducts.length >= 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left: Bars + text */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Resultados evaluación sensorial de preferencia
                </h3>
                <p className="text-gray-700 mb-6">
                  Se realizó una evaluación sensorial de preferencia donde se
                  comparó el desempeño de las muestras más relevantes entre sí.
                </p>

                <div className="space-y-4">
                  {topProducts.map((p) => {
                    const meta = getProductMeta(p.product_id);
                    return (
                      <div
                        key={p.product_id}
                        className="flex items-center space-x-4"
                      >
                        <div className="w-20 text-right">
                          <div className="font-semibold text-gray-800">
                            {meta?.name || p.product_name}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                            <div
                              className={`h-6 rounded-full ${
                                p === topProducts[0]
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
                              }`}
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right font-bold text-gray-900">
                          {p.percentage.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 text-sm text-gray-600 italic">
                  {report.statistical_analysis.friedman_test.significant ? (
                    <span>
                      Hay diferencias{" "}
                      <strong>estadísticamente significativas</strong> entre las
                      muestras evaluadas (p{" "}
                      {report.statistical_analysis.friedman_test.p_value}).
                    </span>
                  ) : (
                    <span>
                      No existe diferencia{" "}
                      <strong>estadísticamente significativa</strong> entre las
                      muestras.
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Most frequent comments per top 2 products */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Comentarios más frecuentes
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topProducts.map((p) => {
                    const meta = getProductMeta(p.product_id);
                    const feedback = getProductFeedback(p.product_id);
                    const positives = (
                      feedback?.first_place_comments || []
                    ).slice(0, 3);
                    const negatives = (
                      feedback?.third_place_comments || []
                    ).slice(0, 3);

                    return (
                      <div key={p.product_id} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <h4 className="font-semibold text-gray-900">
                            {meta?.name || p.product_name}
                          </h4>
                        </div>

                        <div className="space-y-2">
                          {positives.length > 0 && (
                            <ul className="space-y-1">
                              {positives.map((c, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start text-sm text-gray-700"
                                >
                                  <span className="mr-2 text-green-500">✔</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {negatives.length > 0 && (
                            <ul className="space-y-1 mt-2">
                              {negatives.map((c, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start text-sm text-gray-700"
                                >
                                  <span className="mr-2 text-red-500">✘</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {positives.length === 0 && negatives.length === 0 && (
                            <p className="text-sm text-gray-500">
                              No hay comentarios registrados para esta muestra.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preference Rankings */}
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🏆 Ranking de Preferencias
          </h2>

          <div className="space-y-6">
            {report.preference_analysis.map((product, index) => (
              <div
                key={product.product_id}
                className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${getPositionColor(
                        index + 1
                      )} flex items-center justify-center text-2xl`}
                    >
                      {getPositionIcon(index + 1)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {product.product_name}
                      </h3>
                      <p className="text-gray-600">
                        {product.percentage.toFixed(1)}% de preferencia
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-yellow-100 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {product.first_place_count}
                        </div>
                        <div className="text-xs text-yellow-700">1er Lugar</div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">
                          {product.second_place_count}
                        </div>
                        <div className="text-xs text-gray-700">2do Lugar</div>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {product.third_place_count}
                        </div>
                        <div className="text-xs text-orange-700">3er Lugar</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Porcentaje de Preferencia</span>
                    <span>{product.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistical Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Friedman Test */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg
                className="w-6 h-6 mr-3 text-blue-600"
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
              Prueba de Friedman
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Chi-cuadrado:</span>
                <span className="font-bold text-blue-600">
                  {report.statistical_analysis.friedman_test.chi_square}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Grados de libertad:
                </span>
                <span className="font-bold text-blue-600">
                  {report.statistical_analysis.friedman_test.degrees_of_freedom}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Valor p:</span>
                <span className="font-bold text-blue-600">
                  {report.statistical_analysis.friedman_test.p_value}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Valor crítico:
                </span>
                <span className="font-bold text-blue-600">
                  {report.statistical_analysis.friedman_test.critical_value}
                </span>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  report.statistical_analysis.friedman_test.significant
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div className="font-bold text-center">
                  {report.statistical_analysis.friedman_test.significant
                    ? "✅ Significativo"
                    : "❌ No significativo"}
                </div>
                <div className="text-sm text-center mt-1">
                  {report.statistical_analysis.friedman_test.interpretation}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg
                className="w-6 h-6 mr-3 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              Recomendaciones
            </h3>

            <div className="space-y-4">
              {report.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Ranking Table - MAIN RESULTS TABLE */}
        <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl shadow-2xl border-2 border-blue-200 relative">
          {/* Highlight badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            📊 TABLA DE RESULTADOS FINALES 📊
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center flex items-center justify-center pt-6">
            <svg
              className="w-10 h-10 mr-4 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            🏆 RESULTADOS FINALES DE EVALUACIÓN 🏆
          </h2>

          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 font-medium">
              Tabla completa de preferencias por producto - Análisis estadístico
              final
            </p>
            <div className="inline-flex items-center mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <span className="text-sm font-semibold">
                Total Panelistas: {report.total_panelists}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Muestra
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                    🥇 1er Lugar
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                    🥈 2do Lugar
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                    🥉 3er Lugar
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                    Total de Votos
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                    Porcentaje (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.preference_analysis
                  .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
                  .map((product, index) => (
                    <tr
                      key={product.product_id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                index === 0
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                  : index === 1
                                  ? "bg-gradient-to-r from-gray-300 to-gray-500"
                                  : index === 2
                                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                  : "bg-gradient-to-r from-blue-400 to-blue-600"
                              }`}
                            >
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : index + 1}
                            </div>
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-800">
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-lg font-bold text-gray-900">
                              {product.product_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              Código: {product.product_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-2">
                          <span className="text-xl font-bold text-yellow-700">
                            {product.first_place_count}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-xl font-bold text-gray-700">
                            {product.second_place_count}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="bg-orange-100 border border-orange-200 rounded-lg px-3 py-2">
                          <span className="text-xl font-bold text-orange-700">
                            {product.third_place_count}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="bg-blue-100 border border-blue-200 rounded-lg px-4 py-2">
                          <span className="text-2xl font-bold text-blue-700">
                            {product.total_votes}
                          </span>
                          <div className="text-xs text-blue-600 font-medium">
                            votos
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div
                          className={`rounded-lg px-4 py-2 border-2 ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-600"
                              : index === 1
                              ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-600"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white border-orange-600"
                              : "bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-600"
                          }`}
                        >
                          <span className="text-xl font-bold">
                            {product.percentage.toFixed(1)}%
                          </span>
                          {index === 0 && (
                            <div className="text-xs opacity-90 font-medium">
                              🏆 Ganador
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Visual Chart */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Distribución de Preferencias
            </h3>
            <div className="space-y-4">
              {report.preference_analysis.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center space-x-4"
                >
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">
                    {product.product_name}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className={`h-6 rounded-full transition-all duration-1000 ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-400 to-gray-600"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-400 to-orange-600"
                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                      }`}
                      style={{ width: `${product.percentage}%` }}
                    >
                      <div className="flex items-center justify-center h-full text-white text-xs font-bold px-2">
                        {product.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-bold text-gray-900">
                    {product.total_votes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panelist Comments */}
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center">
            <svg
              className="w-8 h-8 mr-3 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Comentarios de Panelistas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample comments - In a real implementation, this would come from the backend */}
            <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full mr-2">
                  1
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Panelista #1
                </span>
              </div>
              <p className="text-gray-700 italic text-sm">
                &quot;La de Fritz tiene mejor sabor y textura&quot;
              </p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className="font-medium">1er:</span>{" "}
                <span className="ml-1 text-blue-600 font-semibold">Fritz</span>
                <span className="mx-2">•</span>
                <span className="font-medium">2do:</span>{" "}
                <span className="ml-1 text-gray-600">Kiero</span>
                <span className="mx-2">•</span>
                <span className="font-medium">3ro:</span>{" "}
                <span className="ml-1 text-orange-600">Osole</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full mr-2">
                  2
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Panelista #2
                </span>
              </div>
              <p className="text-gray-700 italic text-sm">
                &quot;Osole tiene mejor color&quot;
              </p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className="font-medium">1er:</span>{" "}
                <span className="ml-1 text-blue-600 font-semibold">Osole</span>
                <span className="mx-2">•</span>
                <span className="font-medium">2do:</span>{" "}
                <span className="ml-1 text-gray-600">Fritz</span>
                <span className="mx-2">•</span>
                <span className="font-medium">3ro:</span>{" "}
                <span className="ml-1 text-orange-600">Kiero</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border-l-4 border-purple-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full mr-2">
                  3
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Panelista #3
                </span>
              </div>
              <p className="text-gray-700 italic text-sm">
                &quot;La de Fritz sabe más natural&quot;
              </p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className="font-medium">1er:</span>{" "}
                <span className="ml-1 text-blue-600 font-semibold">Fritz</span>
                <span className="mx-2">•</span>
                <span className="font-medium">2do:</span>{" "}
                <span className="ml-1 text-gray-600">Osole</span>
                <span className="mx-2">•</span>
                <span className="font-medium">3ro:</span>{" "}
                <span className="ml-1 text-orange-600">Kiero</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights - Briefing style (single structured report) */}
        {report.insights && report.insights.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-10 rounded-3xl text-white">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 mr-4"
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
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Informe generado por IA siguiendo el briefing de evaluación
                sensorial, comparando comentarios por muestra y orden de
                preferencia.
              </p>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-6 md:p-8 shadow-xl max-h-[600px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                {report.insights.join("\n\n")}
              </pre>
            </div>
          </div>
        )}

        {/* Qualitative Feedback */}
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            💬 Comentarios Cualitativos
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Positive Comments */}
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center">
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
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                Comentarios Positivos
              </h3>
              <div className="space-y-3">
                {report.qualitative_feedback.top_positive_comments.map(
                  (comment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-green-50 border-l-4 border-green-400 rounded"
                    >
                      <p className="text-gray-700 italic">
                        &quot;{comment}&quot;
                      </p>
                    </div>
                  )
                )}
                {report.qualitative_feedback.top_positive_comments.length ===
                  0 && (
                  <p className="text-gray-500 italic">
                    No hay comentarios positivos registrados
                  </p>
                )}
              </div>
            </div>

            {/* Negative Comments */}
            <div>
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
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
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v7a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m4 0H9"
                  />
                </svg>
                Comentarios Negativos
              </h3>
              <div className="space-y-3">
                {report.qualitative_feedback.top_negative_comments.map(
                  (comment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 border-l-4 border-red-400 rounded"
                    >
                      <p className="text-gray-700 italic">
                        &quot;{comment}&quot;
                      </p>
                    </div>
                  )
                )}
                {report.qualitative_feedback.top_negative_comments.length ===
                  0 && (
                  <p className="text-gray-500 italic">
                    No hay comentarios negativos registrados
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

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
