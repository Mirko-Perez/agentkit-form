import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { apiService } from "../utils/api";

interface FileImportProps {
  onImportSuccess: (surveyId: string) => void;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export const FileImport: React.FC<FileImportProps> = ({ onImportSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    surveyId: string;
    responses: number;
    insights: string[];
  } | null>(null);

  // Category selection
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const regions = ["Perú", "Chile", "Venezuela", "España"];
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await apiService.getCategories(true); // Get only active categories
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!selectedCategory) {
        setError("Por favor selecciona una categoría primero");
        return;
      }
      if (!selectedRegion) {
        setError("Por favor selecciona una región primero");
        return;
      }
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    [selectedCategory, selectedRegion]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
      "application/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv",
      "application/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid Excel (.xlsx, .xls) or CSV file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData with file and category
      const formData = new FormData();
      formData.append("file", file);
      if (selectedCategory) formData.append("category_id", selectedCategory);
      if (selectedRegion) formData.append("region", selectedRegion);

      const result = await apiService.importFileWithCategory(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSuccess({
        surveyId: result.survey_id,
        responses: result.imported_responses,
        insights: result.insights,
      });

      onImportSuccess(result.survey_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleGoogleSheetsImport = async () => {
    const sheetUrl = prompt("Enter Google Sheets URL:");
    if (!sheetUrl) return;

    try {
      await apiService.importFromGoogleSheets(sheetUrl);
      alert("Google Sheets import feature is coming soon!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Import Survey Data
        </h2>
        <p className="text-gray-600">
          Upload Excel (.xlsx, .xls) or CSV files, or import from Google Sheets
        </p>
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría del Producto *
        </label>
        {loadingCategories ? (
          <div className="flex items-center text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
            Cargando categorías...
          </div>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.description && ` - ${category.description}`}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Selecciona la categoría de producto para clasificar esta encuesta
        </p>
      </div>

      {/* Region Selection */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Región *
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        >
          <option value="">Selecciona una región</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          La región se usará para filtrar y mostrar en la planilla de reportes
        </p>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "pointer-events-none opacity-50" : ""} ${
          !selectedCategory ? "border-yellow-400 bg-yellow-50" : ""
        }`}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Uploading file...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">{uploadProgress}%</div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Excel (.xlsx, .xls) or CSV files up to 10MB
              </p>
              {!selectedCategory && (
                <p className="text-sm font-semibold text-yellow-600 mt-2">
                  ⚠️ Selecciona una categoría arriba antes de subir
                </p>
              )}
            </div>
          </>
        )}

        <input {...getInputProps()} />
      </div>

      {/* Alternative Import Options */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleGoogleSheetsImport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          disabled={uploading}
        >
          Import from Google Sheets
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-800 font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg
              className="w-5 h-5 text-green-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-800 font-medium">
              Import Successful!
            </span>
          </div>

          <div className="space-y-2 text-sm text-green-700">
            <p>
              <strong>Survey ID:</strong> {success.surveyId}
            </p>
            <p>
              <strong>Responses Imported:</strong> {success.responses}
            </p>
          </div>

          {success.insights.length > 0 && (
            <div className="mt-4">
              <h4 className="text-green-800 font-medium mb-2">AI Insights:</h4>
              <ul className="space-y-1">
                {success.insights.map((insight, index) => (
                  <li
                    key={index}
                    className="text-green-700 text-sm flex items-start"
                  >
                    <span className="mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <a
              href={`/reports?id=${success.surveyId}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Report
            </a>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
