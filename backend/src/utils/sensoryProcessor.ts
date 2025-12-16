import * as XLSX from 'xlsx';
import { SensoryEvaluation, SensoryProduct, SensoryPreference } from '../models/Survey';

export interface SensoryImportResult {
  evaluation_id: string;
  products: SensoryProduct[];
  evaluations: SensoryEvaluation[];
}

export class SensoryProcessor {
  /**
   * Process sensory evaluation from Excel/CSV
   * Detects paired comparison (2 samples) or ranking (3+ samples) format
   */
  static async processSensoryFile(buffer: Buffer, filename: string, isCSV: boolean = false): Promise<SensoryImportResult> {
    try {
      const workbook = isCSV 
        ? XLSX.read(buffer.toString('utf-8'), { type: 'string' })
        : XLSX.read(buffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      // Detect format type
      const format = this.detectSensoryFormat(headers);
      
      if (format === 'paired') {
        return this.processPairedComparison(headers, dataRows, filename);
      } else if (format === 'ranking') {
        return this.processRankingTest(headers, dataRows, filename);
      } else {
        throw new Error('Unsupported sensory evaluation format');
      }
    } catch (error) {
      console.error('Error processing sensory file:', error);
      throw new Error(`Failed to process sensory file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect if file is paired comparison or ranking test
   */
  private static detectSensoryFormat(headers: string[]): 'paired' | 'ranking' | 'unknown' {
    const headerText = headers.join(' ').toLowerCase();
    
    // Look for indicators of paired comparison
    if (headerText.includes('2 muestras') || headerText.includes('dos muestras')) {
      return 'paired';
    }
    
    // Look for indicators of ranking/ordenamiento
    if (headerText.includes('ordenamiento') || headerText.includes('orden') || headerText.includes('ranking')) {
      return 'ranking';
    }

    // Try to detect by structure - if we see "Muestra XXX" pattern
    const sampleColumns = headers.filter(h => 
      /muestra\s*\d+/i.test(h) || /codigo\s*\d+/i.test(h)
    );

    if (sampleColumns.length === 2) {
      return 'paired';
    } else if (sampleColumns.length >= 3) {
      return 'ranking';
    }

    // Default to paired for now
    return 'paired';
  }

  /**
   * Process paired comparison (2 samples)
   * Example columns: "elija la muestra que más le gustó", "Comentarios muestra 144", "Comentarios muestra 232"
   */
  private static processPairedComparison(
    headers: string[], 
    dataRows: any[][], 
    filename: string
  ): SensoryImportResult {
    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Find preference column (usually contains "elija" or "gustó")
    const preferenceColIndex = headers.findIndex(h => 
      /elija|gust|prefer/i.test(h.toLowerCase())
    );

    if (preferenceColIndex === -1) {
      throw new Error('Could not find preference column in file');
    }

    // Extract sample codes from data
    const sampleCodes = new Set<string>();
    dataRows.forEach(row => {
      const preferenceText = row[preferenceColIndex]?.toString() || '';
      const match = preferenceText.match(/muestra\s*(\d+)/i) || preferenceText.match(/(\d+)/);
      if (match) {
        sampleCodes.add(match[1]);
      }
    });

    const samples = Array.from(sampleCodes);
    
    if (samples.length < 2) {
      throw new Error('Could not identify sample codes from data');
    }

    // Create products
    const products: SensoryProduct[] = samples.map((code, index) => ({
      id: `product_${evaluationId}_${code}`,
      evaluation_id: evaluationId,
      name: `Muestra ${code}`,
      code: code,
      description: `Muestra de evaluación sensorial`,
      position: index + 1,
      is_deleted: false
    }));

    // Find comment columns for each sample
    const commentColumns: Record<string, number> = {};
    samples.forEach(code => {
      const colIndex = headers.findIndex(h => 
        h.toLowerCase().includes(`comentario`) && h.includes(code)
      );
      if (colIndex !== -1) {
        commentColumns[code] = colIndex;
      }
    });

    // Create evaluations from data rows
    const evaluations: SensoryEvaluation[] = dataRows
      .filter(row => row[preferenceColIndex]) // Has preference data
      .map((row, index) => {
        const preferenceText = row[preferenceColIndex]?.toString() || '';
        const preferredMatch = preferenceText.match(/muestra\s*(\d+)/i) || preferenceText.match(/(\d+)/);
        const preferredCode = preferredMatch ? preferredMatch[1] : samples[0];

        // Create preferences (winner = position 1, loser = position 2)
        const preferences: SensoryPreference[] = samples.map(code => ({
          product_id: `product_${evaluationId}_${code}`,
          position: code === preferredCode ? 1 : 2,
          reason: commentColumns[code] !== undefined ? row[commentColumns[code]]?.toString() || '' : ''
        }));

        return {
          id: `resp_${evaluationId}_${index + 1}`,
          evaluation_id: evaluationId,
          panelist_id: `panelist_${index + 1}`,
          panelist_name: `Panelista ${index + 1}`,
          preferences,
          submitted_at: new Date(),
          is_deleted: false
        };
      });

    return {
      evaluation_id: evaluationId,
      products,
      evaluations
    };
  }

  /**
   * Process ranking test (3+ samples)
   * Example: Ordenamiento de preferencias
   */
  private static processRankingTest(
    headers: string[],
    dataRows: any[][],
    filename: string
  ): SensoryImportResult {
    // TO DO: Implement ranking test processing
    // For now, throw error
    throw new Error('Ranking test processing not yet implemented');
  }
}







