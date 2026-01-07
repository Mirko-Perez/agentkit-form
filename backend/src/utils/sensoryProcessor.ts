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

    // Extract sample codes from HEADERS first (more reliable)
    let sampleCodes = this.extractSampleCodesFromHeaders(headers);

    // If not found in headers, try from data rows
    if (sampleCodes.length < 2) {
      const codesFromData = new Set<string>();
      dataRows.forEach(row => {
        const preferenceText = row[preferenceColIndex]?.toString() || '';
        const codes = this.extractSampleCodesFromText(preferenceText);
        codes.forEach(code => codesFromData.add(code));
      });
      sampleCodes = Array.from(codesFromData);
    }
    
    if (sampleCodes.length < 2) {
      throw new Error('Could not identify sample codes from data');
    }

    const samples = sampleCodes;

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

    // Find comment columns for each sample (case-insensitive)
    const commentColumns: Record<string, number> = {};
    samples.forEach(code => {
      const colIndex = headers.findIndex(h => 
        h.toLowerCase().includes(`comentario`) && h.toLowerCase().includes(code.toLowerCase())
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
        // Extract all codes from preference text and find which one matches our samples
        const extractedCodes = this.extractSampleCodesFromText(preferenceText);
        const preferredCode = extractedCodes.find(code => 
          samples.some(s => s.toLowerCase() === code.toLowerCase())
        ) || samples[0];

        // Create preferences (winner = position 1, loser = position 2)
        const preferences: SensoryPreference[] = samples.map(code => ({
          product_id: `product_${evaluationId}_${code}`,
          position: code.toLowerCase() === preferredCode.toLowerCase() ? 1 : 2,
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

  /**
   * Extract sample codes from headers (more reliable method)
   * Looks for patterns like: "Comentarios muestra XXX", "Califica Sabor XXX", "Observaciones XXX"
   */
  private static extractSampleCodesFromHeaders(headers: string[]): string[] {
    const sampleCodes = new Set<string>();
    
    // Keywords that indicate a sample-related column (more specific)
    const keywords = [
      'comentario', 'observacion', 'califica', 'sabor', 'color', 'aroma', 
      'textura', 'olor', 'apariencia'
    ];

    headers.forEach(header => {
      const headerLower = header.toLowerCase();
      
      // Must contain at least one keyword AND contain "muestra" or a code pattern
      const hasKeyword = keywords.some(kw => headerLower.includes(kw));
      const hasSampleIndicator = headerLower.includes('muestra') || 
                                 headerLower.includes('sample') ||
                                 /\d{3,6}/.test(header); // or has numeric code
      
      if (!hasKeyword && !hasSampleIndicator) return;

      // Extract codes from this header
      const codes = this.extractSampleCodesFromText(header);
      codes.forEach(code => {
        // Additional validation: code should be reasonable length
        if (code.length >= 2 && code.length <= 10) {
          sampleCodes.add(code);
        }
      });
    });

    return Array.from(sampleCodes);
  }

  /**
   * Extract sample codes from text using flexible patterns
   * Supports: "Muestra XXX", "Sample XXX", "Código XXX", "M-XXX", etc.
   */
  private static extractSampleCodesFromText(text: string): string[] {
    const codes: string[] = [];
    const seen = new Set<string>();
    
    // Pattern 1: "Muestra/Sample/Código XXX" - most common and reliable
    // Captures: 144, FRITZ, OSOLE, A-1, C03, etc.
    const pattern1 = /(?:muestra|sample|código|codigo|cód)\s+([a-z0-9\-_#]+)/gi;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const code = match[1].toUpperCase().trim();
      // Filter out common Spanish/English words
      const commonWords = ['MAS', 'QUE', 'LAS', 'LOS', 'UNA', 'THE', 'AND', 'HAY'];
      if (code && code.length >= 2 && code.length <= 20 && !commonWords.includes(code) && !seen.has(code)) {
        codes.push(code);
        seen.add(code);
      }
    }

    // Pattern 2: Look for numeric codes (3-6 digits) - common in sensory tests
    if (codes.length === 0) {
      const pattern2 = /\b(\d{3,6})\b/g;
      while ((match = pattern2.exec(text)) !== null) {
        const code = match[1];
        if (!seen.has(code)) {
          codes.push(code);
          seen.add(code);
        }
      }
    }

    return codes;
  }
}









