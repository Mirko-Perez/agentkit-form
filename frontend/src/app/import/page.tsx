'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileImport } from '../../components/FileImport';

export default function ImportPage() {
  const router = useRouter();

  const handleImportSuccess = (surveyId: string) => {
    // Redirect to the report page after successful import
    setTimeout(() => {
      router.push(`/reports/${surveyId}`);
    }, 2000); // Give user time to see success message
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Volver al Panel
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-semibold text-gray-800">
                Importar Datos de Encuesta
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <FileImport onImportSuccess={handleImportSuccess} />
      </div>
    </div>
  );
}
