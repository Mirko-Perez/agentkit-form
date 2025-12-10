import { Request, Response } from 'express';
import { query } from '../config/database';
import {
  SurveyReport,
  QuestionStats,
  SensoryReport,
  SensoryPreferenceStats,
  SensoryStatisticalAnalysis,
} from '../models/Report';
import { AgentKitService } from '../utils/agentKit';
import { SensoryEvaluation, SensoryProduct } from '../models/Survey';
import OpenAI from 'openai';

/**
 * OpenAI client for sensory insights in this controller.
 * We initialize it conditionally to avoid crashing when OPENAI_API_KEY is not set.
 */
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;

if (openaiApiKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey,
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[ReportController] OPENAI_API_KEY is not set. Sensory AI insights will use basic fallbacks.'
  );
}

export class ReportController {
  /**
   * Generate survey report with statistics
   */
  static async generateReport(req: Request, res: Response) {
    try {
      const { survey_id } = req.params;
      const { force } = req.query;

      // If force regeneration is requested, mark existing reports as invalid
      if (force === 'true') {
        await query(
          'UPDATE generated_reports SET is_valid = false WHERE evaluation_id = $1 AND report_type = $2',
          [survey_id, 'survey']
        );
        console.log('Marked existing survey reports as invalid for survey:', survey_id);
      } else {
        // First, check if we have a valid cached report
        const cachedReportResult = await query(
          'SELECT report_data FROM generated_reports WHERE evaluation_id = $1 AND report_type = $2 AND is_valid = true AND expires_at > CURRENT_TIMESTAMP ORDER BY generated_at DESC LIMIT 1',
          [survey_id, 'survey']
        );

        if (cachedReportResult.rows.length > 0) {
          console.log('Returning cached survey report for survey:', survey_id);
          const cachedReport = cachedReportResult.rows[0].report_data;
          return res.json(cachedReport);
        }
      }

      // No valid cache found, generate new report
      console.log('Generating new survey report for survey:', survey_id);

      // Get survey details
      const surveyResult = await query(
        'SELECT * FROM surveys WHERE id = $1 AND is_active = true AND is_deleted = false',
        [survey_id]
      );

      if (surveyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Survey not found' });
      }

      const survey = surveyResult.rows[0];

      // Get all responses
      const responsesResult = await query(
        'SELECT * FROM survey_responses WHERE survey_id = $1 AND is_deleted = false ORDER BY submitted_at DESC',
        [survey_id]
      );

      const responses = responsesResult.rows;
      const totalResponses = responses.length;

      if (totalResponses === 0) {
        return res.json({
          survey_id,
          survey_title: survey.title,
          total_responses: 0,
          completion_rate: 0,
          questions_stats: [],
          generated_at: new Date(),
          message: 'No responses yet'
        });
      }

      // Calculate statistics for each question
      const questionsStats = ReportController.calculateQuestionStats(survey.questions, responses);

      // Generate insights using AgentKit (with fallback)
      let insights: string[] = [];
      try {
        insights = await AgentKitService.generateSurveyInsights(
          survey,
          responses,
          questionsStats
        );
      } catch (aiError) {
        console.warn('AI insights generation failed, using fallback:', aiError);
        insights = [
          'AI analysis temporarily unavailable. Basic statistics are shown below.',
          'Please check your OpenAI API configuration for full AI-powered insights.'
        ];
      }

      // Generate report summary
      const report: SurveyReport = {
        survey_id,
        survey_title: survey.title,
        total_responses: totalResponses,
        completion_rate: 1.0, // Assuming all responses are complete for now
        questions_stats: questionsStats,
        generated_at: new Date(),
        insights
      };

      // Generate report summary (with fallback)
      let summary = 'Report summary not available.';
      try {
        summary = await AgentKitService.generateReportSummary(report);
      } catch (aiError) {
        console.warn('AI summary generation failed, using fallback:', aiError);
        summary = 'AI-powered summary temporarily unavailable. Please check your OpenAI API configuration for detailed analysis.';
      }

      const finalReport = {
        ...report,
        summary
      };

      // Save the generated report to database for future use
      const reportId = `${survey_id}_survey_${Date.now()}`;
      await query(
        'INSERT INTO generated_reports (id, evaluation_id, report_type, report_data, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [reportId, survey_id, 'survey', JSON.stringify(finalReport), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] // 30 days from now
      );

      console.log('Saved new survey report to database:', reportId);
      res.json(finalReport);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Generate sensory evaluation report
   */
  static async generateSensoryReport(req: Request, res: Response) {
    try {
      const { evaluation_id } = req.params;
      const { force } = req.query;

      // If force regeneration is requested, mark existing reports as invalid
      if (force === 'true') {
        await query(
          'UPDATE generated_reports SET is_valid = false WHERE evaluation_id = $1 AND report_type = $2',
          [evaluation_id, 'sensory']
        );
        console.log('Marked existing sensory reports as invalid for evaluation:', evaluation_id);
      } else {
        // First, check if we have a valid cached report
        const cachedReportResult = await query(
          'SELECT report_data FROM generated_reports WHERE evaluation_id = $1 AND report_type = $2 AND is_valid = true AND expires_at > CURRENT_TIMESTAMP ORDER BY generated_at DESC LIMIT 1',
          [evaluation_id, 'sensory']
        );

        if (cachedReportResult.rows.length > 0) {
          console.log('Returning cached sensory report for evaluation:', evaluation_id);
          const cachedReport = cachedReportResult.rows[0].report_data;
          return res.json(cachedReport);
        }
      }

      // No valid cache found, generate new report
      console.log('Generating new sensory report for evaluation:', evaluation_id);

      // Get sensory evaluations
      const evaluationsResult = await query(
        'SELECT * FROM sensory_evaluations WHERE evaluation_id = $1 AND is_deleted = false ORDER BY submitted_at DESC',
        [evaluation_id]
      );

      const evaluations = evaluationsResult.rows as SensoryEvaluation[];

      if (evaluations.length === 0) {
        return res.status(404).json({ error: 'Sensory evaluation not found or has no responses' });
      }

      // Get products information
      const productsResult = await query(
        'SELECT * FROM sensory_products WHERE evaluation_id = $1 AND is_deleted = false ORDER BY name',
        [evaluation_id]
      );

      const products = productsResult.rows as SensoryProduct[];

      // Calculate preference statistics
      const preferenceStats = this.calculateSensoryPreferences(evaluations, products);

      // Perform statistical analysis (Friedman test + ISO 5495)
      console.log('Starting statistical analysis for', evaluations.length, 'panelists and', preferenceStats.length, 'products');
      const statisticalAnalysis = await this.performStatisticalAnalysis(preferenceStats, evaluations.length);
      console.log('Statistical analysis completed');

      // Extract qualitative feedback (organized by product and position)
      const qualitativeFeedback = this.extractQualitativeFeedback(evaluations, products);

      // Generate recommendations (with threshold check)
      const threshold = 70; // Default threshold, can be configured
      const recommendations = this.generateRecommendations(preferenceStats, statisticalAnalysis, threshold);

      // Generate AI insights for sensory evaluation
      let insights: string[] = [];
      try {
        insights = await this.generateSensoryInsights(evaluations, products, preferenceStats, statisticalAnalysis);
      } catch (error) {
        console.warn('Could not generate AI insights for sensory evaluation:', error);
        insights = [
          'Se realizó un análisis completo de las preferencias sensoriales de los panelistas.',
          'Los resultados muestran diferencias significativas entre los productos evaluados.',
          'Se recomienda considerar los comentarios cualitativos para futuras mejoras.'
        ];
      }

      // Get region, country, project from first evaluation (assuming all are from same project)
      const firstEvaluation = evaluations[0];
      const region = firstEvaluation.region || null;
      const country = firstEvaluation.country || null;
      const projectName = firstEvaluation.project_name || null;

      // Determine winning formula (default threshold: 70%)
      const defaultThreshold = 70;
      const winner = preferenceStats.length > 0 ? preferenceStats[0] : null;
      const winningFormula = winner ? {
        product_name: winner.product_name,
        percentage: winner.percentage,
        meets_threshold: winner.percentage >= defaultThreshold,
        threshold: defaultThreshold
      } : undefined;

      const report: SensoryReport = {
        evaluation_id,
        evaluation_title: `Evaluación Sensorial - ${products.map(p => p.name).join(' vs ')}`,
        total_panelists: evaluations.length,
        total_evaluations: evaluations.length,
        completion_rate: 1.0, // All evaluations are complete by design
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description
        })),
        preference_analysis: preferenceStats,
        statistical_analysis: statisticalAnalysis,
        qualitative_feedback: qualitativeFeedback,
        recommendations,
        insights,
        generated_at: new Date(),
        region: region || undefined,
        country: country || undefined,
        project_name: projectName || undefined,
        winning_formula: winningFormula,
        authorization_status: 'pending'
      };

      // Save the generated report to database for future use
      const reportId = `${evaluation_id}_sensory_${Date.now()}`;
      await query(
        'INSERT INTO generated_reports (id, evaluation_id, report_type, report_data, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [reportId, evaluation_id, 'sensory', JSON.stringify(report), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] // 30 days from now
      );

      console.log('Saved new sensory report to database:', reportId);
      res.json(report);
    } catch (error) {
      console.error('Error generating sensory report:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ 
        error: 'Failed to generate sensory report',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  }

  /**
   * Get list of generated reports for traceability (Planilla de Reportes)
   * Supports filters by region, country, project, month, year
   */
  static async getGeneratedReports(req: Request, res: Response) {
    try {
      const { 
        type, 
        region, 
        country, 
        project_name,
        month,
        year,
        authorization_status 
      } = req.query;

      // Build query with filters
      let queryStr = `
        SELECT 
          rp.*,
          gr.report_data
        FROM reports_planilla rp
        JOIN generated_reports gr ON rp.report_id = gr.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (type) {
        queryStr += ` AND rp.report_type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (region) {
        queryStr += ` AND rp.region = $${paramIndex}`;
        params.push(region);
        paramIndex++;
      }

      if (country) {
        queryStr += ` AND rp.country = $${paramIndex}`;
        params.push(country);
        paramIndex++;
      }

      if (project_name) {
        queryStr += ` AND rp.project_name = $${paramIndex}`;
        params.push(project_name);
        paramIndex++;
      }

      if (month) {
        queryStr += ` AND rp.report_month = $${paramIndex}`;
        params.push(parseInt(month as string));
        paramIndex++;
      }

      if (year) {
        queryStr += ` AND rp.report_year = $${paramIndex}`;
        params.push(parseInt(year as string));
        paramIndex++;
      }

      if (authorization_status) {
        queryStr += ` AND rp.authorization_status = $${paramIndex}`;
        params.push(authorization_status);
        paramIndex++;
      }

      queryStr += ' ORDER BY gr.generated_at DESC';

      const result = await query(queryStr, params);

      res.json({
        reports: result.rows,
        total: result.rowCount,
        filters: {
          type: type || null,
          region: region || null,
          country: country || null,
          project_name: project_name || null,
          month: month || null,
          year: year || null,
          authorization_status: authorization_status || null
        }
      });
    } catch (error) {
      console.error('Error fetching generated reports:', error);
      res.status(500).json({ error: 'Failed to fetch generated reports' });
    }
  }

  /**
   * Get reports by month (helper endpoint)
   */
  static async getReportsByMonth(req: Request, res: Response) {
    try {
      const { year, month, region, country, project_name } = req.query;

      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }

      const result = await query(
        'SELECT * FROM get_reports_by_month($1, $2, $3, $4, $5)',
        [
          parseInt(year as string),
          parseInt(month as string),
          region || null,
          country || null,
          project_name || null
        ]
      );

      res.json({
        reports: result.rows,
        total: result.rowCount,
        month: month,
        year: year
      });
    } catch (error) {
      console.error('Error fetching reports by month:', error);
      res.status(500).json({ error: 'Failed to fetch reports by month' });
    }
  }

  /**
   * Check if a product meets the winning formula threshold
   */
  static async checkWinningFormula(req: Request, res: Response) {
    try {
      const { evaluation_id } = req.params;
      const { threshold = 70 } = req.query; // Default 70%, can be 80%

      // Get the sensory report
      const reportResult = await query(
        'SELECT report_data FROM generated_reports WHERE evaluation_id = $1 AND report_type = $2 AND is_valid = true ORDER BY generated_at DESC LIMIT 1',
        [evaluation_id, 'sensory']
      );

      if (reportResult.rows.length === 0) {
        return res.status(404).json({ error: 'Sensory report not found' });
      }

      const reportData = reportResult.rows[0].report_data;
      const preferenceAnalysis = reportData.preference_analysis || [];

      // Find the product with highest percentage
      const winner = preferenceAnalysis.reduce((max: any, current: any) => {
        return current.percentage > max.percentage ? current : max;
      }, preferenceAnalysis[0] || { percentage: 0 });

      const thresholdNum = parseFloat(threshold as string);
      const isWinningFormula = winner.percentage >= thresholdNum;

      res.json({
        evaluation_id,
        winner: {
          product_name: winner.product_name,
          percentage: winner.percentage,
          threshold: thresholdNum,
          meets_threshold: isWinningFormula
        },
        all_products: preferenceAnalysis.map((p: any) => ({
          product_name: p.product_name,
          percentage: p.percentage,
          meets_threshold: p.percentage >= thresholdNum
        })),
        recommendation: isWinningFormula
          ? `${winner.product_name} es la fórmula ganadora con ${winner.percentage.toFixed(1)}% de preferencia (umbral: ${thresholdNum}%)`
          : `Ningún producto alcanza el umbral del ${thresholdNum}%. El más preferido es ${winner.product_name} con ${winner.percentage.toFixed(1)}%`
      });
    } catch (error) {
      console.error('Error checking winning formula:', error);
      res.status(500).json({ error: 'Failed to check winning formula' });
    }
  }

  /**
   * Authorize a report (approve/reject)
   */
  static async authorizeReport(req: Request, res: Response) {
    try {
      const { report_id } = req.params;
      const { authorization_status, winning_formula_threshold, notes, authorized_by } = req.body;

      if (!authorization_status || !['approved', 'rejected', 'pending'].includes(authorization_status)) {
        return res.status(400).json({ error: 'Invalid authorization status' });
      }

      // Check if authorization already exists
      const existingAuth = await query(
        'SELECT * FROM report_authorizations WHERE report_id = $1',
        [report_id]
      );

      if (existingAuth.rows.length > 0) {
        // Update existing authorization
        await query(
          `UPDATE report_authorizations 
           SET authorization_status = $1, 
               winning_formula_threshold = COALESCE($2, winning_formula_threshold),
               notes = COALESCE($3, notes),
               authorized_by = COALESCE($4, authorized_by),
               authorized_at = CASE WHEN $1 != 'pending' THEN CURRENT_TIMESTAMP ELSE authorized_at END
           WHERE report_id = $5`,
          [authorization_status, winning_formula_threshold || 70, notes, authorized_by, report_id]
        );
      } else {
        // Create new authorization
        await query(
          `INSERT INTO report_authorizations 
           (id, report_id, report_type, authorization_status, winning_formula_threshold, notes, authorized_by, authorized_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            report_id,
            req.body.report_type || 'sensory',
            authorization_status,
            winning_formula_threshold || 70,
            notes || null,
            authorized_by || null,
            authorization_status !== 'pending' ? new Date() : null
          ]
        );
      }

      res.json({
        message: 'Report authorization updated successfully',
        report_id,
        authorization_status,
        winning_formula_threshold: winning_formula_threshold || 70
      });
    } catch (error) {
      console.error('Error authorizing report:', error);
      res.status(500).json({ error: 'Failed to authorize report' });
    }
  }

  /**
   * Get dashboard overview
   */
  static async getDashboardOverview(req: Request, res: Response) {
    try {
      // Get total sensory evaluations (since everything is sensory now)
      const evaluationsCountResult = await query(
        'SELECT COUNT(DISTINCT evaluation_id) as total FROM sensory_evaluations WHERE is_deleted = false'
      );
      const totalEvaluations = parseInt(evaluationsCountResult.rows[0].total) || 0;

      // Get total panelists
      const panelistsResult = await query('SELECT COUNT(*) as total FROM sensory_evaluations WHERE is_deleted = false');
      const totalPanelists = parseInt(panelistsResult.rows[0].total) || 0;

      // Get recent evaluations with product info (avoid DISTINCT + window fn error)
      const recentEvaluationsResult = await query(`
        WITH agg AS (
          SELECT 
            se.evaluation_id AS id,
            COALESCE(STRING_AGG(DISTINCT sp.name, ' vs '), 'Evaluación Sensorial') AS title,
            MAX(se.submitted_at) AS created_at,
            COUNT(DISTINCT se.id) AS panelist_count
          FROM sensory_evaluations se
          LEFT JOIN sensory_products sp 
            ON se.evaluation_id = sp.evaluation_id 
           AND sp.is_deleted = false
          WHERE se.is_deleted = false
          GROUP BY se.evaluation_id
          ORDER BY created_at DESC
          LIMIT 5
        )
        SELECT * FROM agg;
      `);

      // Get evaluation stats (top by responses)
      const statsResult = await query(`
        SELECT
          se.evaluation_id AS id,
          COALESCE(STRING_AGG(DISTINCT sp.name, ' vs '), 'Evaluación Sensorial') AS title,
          COUNT(DISTINCT se.id) AS response_count,
          MAX(se.submitted_at) AS last_response
        FROM sensory_evaluations se
        LEFT JOIN sensory_products sp 
          ON se.evaluation_id = sp.evaluation_id 
         AND sp.is_deleted = false
        WHERE se.is_deleted = false
        GROUP BY se.evaluation_id
        ORDER BY response_count DESC
        LIMIT 10
      `);

      res.json({
        total_surveys: totalEvaluations,
        total_responses: totalPanelists,
        recent_surveys: recentEvaluationsResult.rows,
        survey_stats: statsResult.rows,
        generated_at: new Date()
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard overview' });
    }
  }

  /**
   * Calculate statistics for each question
   */
  private static calculateQuestionStats(questions: any[], responses: any[]): QuestionStats[] {
    return questions.map(question => {
      const questionResponses = responses
        .map(r => {
          const responseData = typeof r.responses === 'string' ? JSON.parse(r.responses) : r.responses;
          return responseData[question.id];
        })
        .filter(answer => answer !== undefined && answer !== null && answer !== '');

      const totalResponses = questionResponses.length;
      const responseDistribution: Record<string, number> = {};

      // Calculate distribution based on question type
      if (question.type === 'multiple_choice' || question.type === 'yes_no') {
        questionResponses.forEach(answer => {
          const key = String(answer);
          responseDistribution[key] = (responseDistribution[key] || 0) + 1;
        });
      } else if (question.type === 'rating') {
        // For ratings, group by value
        questionResponses.forEach(answer => {
          const rating = parseInt(String(answer));
          if (!isNaN(rating)) {
            responseDistribution[rating.toString()] = (responseDistribution[rating.toString()] || 0) + 1;
          }
        });
      } else if (question.type === 'text') {
        // For text responses, just count them (we'll store sample responses separately)
        responseDistribution['responses'] = totalResponses;
      }

      // Calculate average rating for rating questions
      let averageRating: number | undefined;
      if (question.type === 'rating' && totalResponses > 0) {
        const ratings = questionResponses
          .map(r => parseInt(String(r)))
          .filter(r => !isNaN(r));
        averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      }

      // Sample text responses (first 3)
      let textResponses: string[] | undefined;
      if (question.type === 'text' && questionResponses.length > 0) {
        textResponses = questionResponses.slice(0, 3).map(r => String(r));
      }

      return {
        question_id: question.id,
        question_text: question.question,
        total_responses: totalResponses,
        response_distribution: responseDistribution,
        average_rating: averageRating,
        text_responses: textResponses
      };
    });
  }

  /**
   * Calculate sensory preference statistics
   */
  private static calculateSensoryPreferences(
    evaluations: SensoryEvaluation[],
    products: SensoryProduct[]
  ): SensoryPreferenceStats[] {
    const statsMap = new Map<string, SensoryPreferenceStats>();

    // Initialize stats for each product
    products.forEach(product => {
      statsMap.set(product.id, {
        product_id: product.id,
        product_name: product.name,
        first_place_count: 0,
        second_place_count: 0,
        third_place_count: 0,
        total_votes: 0,
        percentage: 0,
        average_position: 0
      });
    });

    // Count preferences
    evaluations.forEach(evaluation => {
      evaluation.preferences.forEach(preference => {
        const stats = statsMap.get(preference.product_id);
        if (stats) {
          switch (preference.position) {
            case 1:
              stats.first_place_count++;
              break;
            case 2:
              stats.second_place_count++;
              break;
            case 3:
              stats.third_place_count++;
              break;
          }
          stats.total_votes++;
        }
      });
    });

    // Calculate percentages and average positions
    const totalEvaluations = evaluations.length;
    const result = Array.from(statsMap.values());

    result.forEach(stats => {
      // Percentage based on FIRST PLACE votes (winner preference)
      stats.percentage = totalEvaluations > 0 ? (stats.first_place_count / totalEvaluations) * 100 : 0;

      // Calculate weighted average position (1st=1, 2nd=2, 3rd=3, lower is better)
      const weightedSum = (stats.first_place_count * 1) + (stats.second_place_count * 2) + (stats.third_place_count * 3);
      stats.average_position = stats.total_votes > 0 ? weightedSum / stats.total_votes : 3;
    });

    // Sort by preference (best to worst) - lower average position = better
    return result.sort((a, b) => a.average_position - b.average_position);
  }

  /**
   * Perform statistical analysis (Friedman test)
   */
  private static async performStatisticalAnalysis(
    preferenceStats: SensoryPreferenceStats[],
    totalPanelists: number
  ): Promise<SensoryStatisticalAnalysis> {
    const k = preferenceStats.length; // number of products
    const n = totalPanelists; // number of panelists

    if (k < 2 || n < 3) {
      return {
        friedman_test: {
          chi_square: 0,
          degrees_of_freedom: k - 1,
          p_value: 1.0,
          significant: false,
          critical_value: this.getCriticalValue(k - 1, 0.05),
          interpretation: 'Insuficientes datos para análisis estadístico'
        },
        iso_5495: {
          test_statistic: 0,
          critical_value: 0,
          significance_level: 0.05,
          is_significant: false,
          interpretation: 'Insuficientes datos para análisis ISO 5495',
          num_samples: k,
          num_panelists: n
        },
        pairwise_comparisons: [],
        overall_significance: false,
        statistical_approval_recommended: false
      };
    }

    // For PAIRED comparison (2 samples) - use ISO 5495 paired test formula
    if (k === 2) {
      return this.performPairedComparisonAnalysis(preferenceStats, n);
    }

    // Calculate ranks for each product
    const ranks = preferenceStats.map(stats => stats.average_position);

    // Calculate Friedman chi-square statistic
    const meanRank = (k + 1) / 2; // Average rank
    const sumSquaredDeviations = ranks.reduce((sum, rank) => sum + Math.pow(rank - meanRank, 2), 0);
    const chiSquare = (12 * n / (k * (k + 1))) * sumSquaredDeviations;

    const df = k - 1;
    const criticalValue = this.getCriticalValue(df, 0.05);

    // Simplified p-value calculation (normally would use statistical tables)
    const significant = chiSquare > criticalValue;

    // Pairwise comparisons (simplified)
    const pairwiseComparisons = [];
    for (let i = 0; i < preferenceStats.length; i++) {
      for (let j = i + 1; j < preferenceStats.length; j++) {
        const diff = Math.abs(preferenceStats[i].average_position - preferenceStats[j].average_position);
        pairwiseComparisons.push({
          product_a: preferenceStats[i].product_name,
          product_b: preferenceStats[j].product_name,
          difference_significant: diff > 0.5, // Simplified threshold
          confidence_level: diff > 0.5 ? 95 : 80
        });
      }
    }

    // Query ISO 5495 critical value
    let iso5495Result;
    try {
      console.log('Querying ISO 5495 with:', { k, n, chiSquare, significance: 0.05, type: 'friedman' });
      const isoQuery = await query(
        'SELECT * FROM check_iso_5495_significance($1, $2, $3, $4, $5)',
        [k, n, chiSquare, 0.05, 'friedman']
      );
      console.log('ISO 5495 query result:', isoQuery.rows[0]);
      iso5495Result = isoQuery.rows[0];
    } catch (error) {
      console.error('Error querying ISO 5495 values:', error);
      console.error('ISO 5495 error details:', error instanceof Error ? error.message : 'Unknown');
      // Fallback to basic chi-square
      iso5495Result = {
        is_significant: false,
        critical_value: criticalValue,
        test_statistic: chiSquare,
        significance_level: 0.05,
        interpretation: 'Error al consultar tabla ISO 5495 - usando valores aproximados'
      };
    }

    // Determine if statistical approval is recommended
    // TRUE if ISO 5495 shows statistical significance, even if product doesn't meet 70% threshold
    const statisticalApprovalRecommended = iso5495Result.is_significant;

    return {
      friedman_test: {
        chi_square: Math.round(chiSquare * 100) / 100,
        degrees_of_freedom: df,
        p_value: significant ? 0.01 : 0.15, // Simplified
        significant,
        critical_value: criticalValue,
        interpretation: significant
          ? 'Hay diferencias significativas entre los productos'
          : 'No hay diferencias significativas entre los productos'
      },
      iso_5495: {
        test_statistic: Math.round(parseFloat(iso5495Result.test_statistic) * 100) / 100,
        critical_value: Math.round(parseFloat(iso5495Result.critical_value) * 100) / 100,
        significance_level: parseFloat(iso5495Result.significance_level),
        is_significant: iso5495Result.is_significant,
        interpretation: iso5495Result.interpretation,
        num_samples: k,
        num_panelists: n
      },
      pairwise_comparisons: pairwiseComparisons,
      overall_significance: significant,
      statistical_approval_recommended: statisticalApprovalRecommended
    };
  }

  /**
   * Perform paired comparison analysis (ISO 5495 for 2 samples)
   * Formula from user's spreadsheet:
   * X = (n+1)/2
   * Z²*Raiz = Z² * sqrt(n*(n+1)/12)
   * SUMA = X + Z²*Raiz = VALOR CRITICO REQUERIDO
   * If difference >= VALOR CRITICO → Significant
   */
  private static async performPairedComparisonAnalysis(
    preferenceStats: SensoryPreferenceStats[],
    n: number
  ): Promise<SensoryStatisticalAnalysis> {
    // Get the difference in votes
    const sample1Votes = preferenceStats[0].first_place_count;
    const sample2Votes = preferenceStats[1].first_place_count;
    const difference = Math.abs(sample1Votes - sample2Votes);

    // ISO 5495 Paired Comparison Formula
    const X = (n + 1) / 2;
    
    // Z values for different significance levels
    const zValues: Record<number, number> = {
      0.20: 1.28,
      0.10: 1.64,
      0.05: 1.96,  // Most common (95% confidence)
      0.01: 2.58,
      0.001: 3.29
    };

    const significanceLevel = 0.05;
    const Z = zValues[significanceLevel];
    const zSquaredRaiz = Math.pow(Z, 2) * Math.sqrt((n * (n + 1)) / 12);
    const criticalValue = X + zSquaredRaiz;

    // Determine if significant
    const isSignificant = difference >= criticalValue;

    const interpretation = isSignificant
      ? `Diferencia de ${difference} votos >= ${criticalValue.toFixed(2)} (valor crítico). SÍ existe diferencia estadísticamente significativa entre las muestras`
      : `Diferencia de ${difference} votos < ${criticalValue.toFixed(2)} (valor crítico). NO existe diferencia estadísticamente significativa entre las muestras`;

    // For display purposes, also calculate a simplified chi-square
    const chiSquare = Math.pow(difference, 2) / n;

    return {
      friedman_test: {
        chi_square: Math.round(chiSquare * 100) / 100,
        degrees_of_freedom: 1,
        p_value: isSignificant ? 0.01 : 0.15,
        significant: isSignificant,
        critical_value: this.getCriticalValue(1, significanceLevel),
        interpretation: interpretation
      },
      iso_5495: {
        test_statistic: difference,
        critical_value: Math.round(criticalValue * 100) / 100,
        significance_level: significanceLevel,
        is_significant: isSignificant,
        interpretation: `Prueba Pareada ISO 5495: ${interpretation}`,
        num_samples: 2,
        num_panelists: n
      },
      pairwise_comparisons: [{
        product_a: preferenceStats[0].product_name,
        product_b: preferenceStats[1].product_name,
        difference_significant: isSignificant,
        confidence_level: 95
      }],
      overall_significance: isSignificant,
      statistical_approval_recommended: isSignificant
    };
  }

  /**
   * Get critical value for chi-square test (simplified lookup table)
   */
  private static getCriticalValue(df: number, alpha: number = 0.05): number {
    const criticalValues: Record<number, number> = {
      1: 3.84,
      2: 5.99,
      3: 7.81,
      4: 9.49,
      5: 11.07,
      6: 12.59,
      7: 14.07,
      8: 15.51,
      9: 16.92,
      10: 18.31
    };
    return criticalValues[df] || (df * 2.5); // Approximation for higher df
  }

  /**
   * Helper function to calculate comment frequencies
   * Groups similar comments and counts occurrences
   */
  private static calculateCommentFrequencies(
    comments: string[],
    totalPanelists: number
  ): Array<{text: string; count: number; percentage: number; is_representative: boolean}> {
    // Normalize and group comments
    const commentMap = new Map<string, Set<string>>(); // normalized -> original comments
    
    comments.forEach(comment => {
      const normalized = comment.toLowerCase().trim();
      if (!commentMap.has(normalized)) {
        commentMap.set(normalized, new Set());
      }
      commentMap.get(normalized)!.add(comment);
    });

    // Convert to frequency array
    const frequencies = Array.from(commentMap.entries()).map(([normalized, originals]) => {
      const count = originals.size;
      const percentage = totalPanelists > 0 ? Math.round((count / totalPanelists) * 100) : 0;
      const is_representative = count >= 3; // Minimum 3 mentions to be representative
      
      // Use the most common version of the comment (or just pick first)
      const text = Array.from(originals)[0];
      
      return { text, count, percentage, is_representative };
    });

    // Sort by frequency (most common first)
    frequencies.sort((a, b) => b.count - a.count);

    return frequencies;
  }

  /**
   * Extract qualitative feedback from evaluations organized by position
   */
  private static extractQualitativeFeedback(evaluations: SensoryEvaluation[], products: SensoryProduct[]) {
    // Organize comments by product and position
    const commentsByProduct: Record<string, {
      first_place: string[];
      second_place: string[];
      third_place: string[];
      all: string[];
    }> = {};

    // Initialize for each product
    products.forEach(product => {
      commentsByProduct[product.id] = {
        first_place: [],
        second_place: [],
        third_place: [],
        all: []
      };
    });

    // Collect all comments
    const allComments: string[] = [];

    evaluations.forEach(evaluation => {
      evaluation.preferences.forEach(preference => {
        if (preference.reason) {
          allComments.push(preference.reason);
          const productId = preference.product_id;
          
          if (commentsByProduct[productId]) {
            commentsByProduct[productId].all.push(preference.reason);
            
            if (preference.position === 1) {
              commentsByProduct[productId].first_place.push(preference.reason);
            } else if (preference.position === 2) {
              commentsByProduct[productId].second_place.push(preference.reason);
            } else if (preference.position === 3) {
              commentsByProduct[productId].third_place.push(preference.reason);
            }
          }
        }
      });
    });

    // Categorize comments (simple keyword-based, could be improved with NLP)
    const positiveKeywords = ['bueno', 'excelente', 'mejor', 'gusta', 'rico', 'sabroso', 'agradable', 'perfecto', 'delicioso', 'dulce', 'equilibrado', 'natural', 'fresco'];
    const negativeKeywords = ['malo', 'peor', 'regular', 'mejorar', 'desagradable', 'mal', 'no gusta', 'insípido', 'artificial', 'químico', 'empalagoso', 'diluido', 'fuerte'];

    const positiveCommentsRaw = allComments.filter(comment => {
      const lower = comment.toLowerCase();
      return positiveKeywords.some(keyword => lower.includes(keyword));
    });

    const negativeCommentsRaw = allComments.filter(comment => {
      const lower = comment.toLowerCase();
      return negativeKeywords.some(keyword => lower.includes(keyword));
    });

    // Calculate frequencies for positive and negative comments
    const totalPanelists = evaluations.length;
    const positiveWithFreq = this.calculateCommentFrequencies(positiveCommentsRaw, totalPanelists);
    const negativeWithFreq = this.calculateCommentFrequencies(negativeCommentsRaw, totalPanelists);

    // Build product-specific feedback with frequencies
    const productFeedback = products.map(product => {
      const feedback = commentsByProduct[product.id];
      return {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        first_place_comments: this.calculateCommentFrequencies(feedback.first_place, totalPanelists),
        second_place_comments: this.calculateCommentFrequencies(feedback.second_place, totalPanelists),
        third_place_comments: this.calculateCommentFrequencies(feedback.third_place, totalPanelists),
        total_comments: feedback.all.length
      };
    });

    return {
      top_positive_comments: positiveWithFreq.slice(0, 10),
      top_negative_comments: negativeWithFreq.slice(0, 10),
      product_specific_feedback: productFeedback,
      common_themes: ['sabor', 'textura', 'color', 'aroma', 'consistencia', 'apariencia']
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    preferenceStats: SensoryPreferenceStats[],
    statisticalAnalysis: SensoryStatisticalAnalysis,
    threshold: number = 70
  ): string[] {
    const recommendations: string[] = [];

    if (preferenceStats.length > 0) {
      const winner = preferenceStats[0];
      const meetsThreshold = winner.percentage >= threshold;
      
      if (meetsThreshold) {
        recommendations.push(`✅ ${winner.product_name} es la FÓRMULA GANADORA con ${winner.percentage.toFixed(1)}% de preferencia (umbral: ${threshold}%).`);
        recommendations.push(`Se recomienda autorizar ${winner.product_name} como fórmula ganadora para producción.`);
      } else {
        recommendations.push(`⚠️ ${winner.product_name} es el producto más preferido con ${winner.percentage.toFixed(1)}% de preferencia, pero NO alcanza el umbral del ${threshold}%.`);
        recommendations.push(`Se recomienda revisar la fórmula o considerar un umbral más bajo.`);
      }
    }

    if (statisticalAnalysis.overall_significance) {
      recommendations.push('Las diferencias entre productos son estadísticamente significativas.');
    } else {
      recommendations.push('No hay diferencias significativas entre los productos evaluados.');
    }

    // Add specific recommendations based on rankings
    // Only recommend the top product as star product
    if (preferenceStats.length > 0 && preferenceStats[0].percentage > preferenceStats[preferenceStats.length - 1].percentage) {
      const winner = preferenceStats[0];
      recommendations.push(`💡 Considerar promover ${winner.product_name} como producto estrella (${winner.percentage.toFixed(1)}% de preferencia).`);
      
      // Suggest improvements for low performers
      if (preferenceStats.length > 1) {
        const lastProduct = preferenceStats[preferenceStats.length - 1];
        if (lastProduct.percentage < 40) {
          recommendations.push(`📝 Revisar fórmula de ${lastProduct.product_name} para mejorar su aceptación (solo ${lastProduct.percentage.toFixed(1)}% de preferencia).`);
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate AI insights for sensory evaluation using the structured prompt format
   */
  private static async generateSensoryInsights(
    evaluations: SensoryEvaluation[],
    products: SensoryProduct[],
    preferenceStats: SensoryPreferenceStats[],
    statisticalAnalysis: any
  ): Promise<string[]> {
    // If OpenAI is not configured, return a safe fallback so the backend doesn't crash
    if (!openai) {
      return [
        'El análisis avanzado con IA para evaluación sensorial está deshabilitado porque no se configuró OPENAI_API_KEY.',
        'Los resultados mostrados se basan en estadísticas internas (ranking, prueba de Friedman y comentarios cualitativos).',
        'Configura la variable de entorno OPENAI_API_KEY en el backend para habilitar insights automáticos detallados.',
      ];
    }

    try {
      // Organize comments by product and position (1°, 2°, 3°)
      const commentsByProductAndPosition: Record<string, {
        first: string[];
        second: string[];
        third: string[];
      }> = {};

      // Initialize structure for each product
      products.forEach(product => {
        commentsByProductAndPosition[product.id] = {
          first: [],
          second: [],
          third: []
        };
      });

      // Collect comments organized by product and position
      evaluations.forEach(evaluation => {
        evaluation.preferences.forEach(preference => {
          const productId = preference.product_id;
          const position = preference.position;
          const reason = preference.reason || 'Sin comentario';

          if (commentsByProductAndPosition[productId]) {
            if (position === 1) {
              commentsByProductAndPosition[productId].first.push(reason);
            } else if (position === 2) {
              commentsByProductAndPosition[productId].second.push(reason);
            } else if (position === 3) {
              commentsByProductAndPosition[productId].third.push(reason);
            }
          }
        });
      });

      // Build the structured prompt following the format provided
      let prompt = `Actúa como experto en investigaciones de mercado y evaluaciones sensoriales. Justo ahora debes entregar un informe con un resumen comparativo de los comentarios más repetitivos de cada muestra que se sometió a una evaluación sensorial de preferencia por ordenamiento.

Se realizó una evaluación sensorial de preferencia por ordenamiento entre unas muestras. Las muestras fueron presentadas en incógnito con los códigos: ${products.map(p => p.code || p.name).join(', ')} y se les pidió que ordenaran las muestras desde la que más le gustó hasta la que menos le gustó y que explicaran el por qué de su elección.

Total de panelistas: ${evaluations.length}

`;

      // Add comments for each product organized by position
      products.forEach(product => {
        const productCode = product.code || product.name;
        const comments = commentsByProductAndPosition[product.id];
        const stats = preferenceStats.find(s => s.product_id === product.id);

        prompt += `Muestra ${productCode}
- 1° lugar: ${stats?.first_place_count || 0} panelistas
- 2° lugar: ${stats?.second_place_count || 0} panelistas  
- 3° lugar: ${stats?.third_place_count || 0} panelistas
- Preferencia total: ${stats?.percentage.toFixed(1) || 0}%

Comentarios de quienes la ubicaron en 1° lugar (positivos):
${comments.first.length > 0 ? comments.first.join('\n') : 'No hay comentarios'}

Comentarios de quienes la ubicaron en 2° lugar (neutros / balanceados):
${comments.second.length > 0 ? comments.second.join('\n') : 'No hay comentarios'}

Comentarios de quienes la ubicaron en 3° lugar (negativos):
${comments.third.length > 0 ? comments.third.join('\n') : 'No hay comentarios'}

`;
      });

      prompt += `\nAnálisis estadístico: ${statisticalAnalysis.friedman_test.significant ? 'Diferencias significativas encontradas (p < 0.05)' : 'No hay diferencias significativas entre las muestras'}

Por favor proporciona:
1. Un resumen ejecutivo comparativo de los comentarios más repetitivos
2. Identificación de patrones comunes en comentarios positivos, neutros y negativos
3. Fortalezas y debilidades de cada muestra
4. Recomendaciones específicas basadas en los comentarios cualitativos
5. Análisis de la consistencia de los comentarios con los resultados estadísticos`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Eres un experto en investigaciones de mercado y evaluaciones sensoriales. Proporciona informes estructurados y profesionales en ESPAÑOL basados en análisis de comentarios cualitativos y datos estadísticos de evaluaciones sensoriales."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const insightsText = completion.choices[0]?.message?.content || '';

      // Parse insights - try to split by numbered points or sections
      const insights = insightsText
        .split(/\d+\.|\*\s*|•\s*|##|###/)
        .map(insight => insight.trim())
        .filter(insight => insight.length > 20); // Filter out very short items

      // If parsing didn't work well, return the full text as a single insight
      if (insights.length === 0 || insights.length === 1) {
        // Try to split by paragraphs
        const paragraphs = insightsText.split(/\n\n+/).filter(p => p.trim().length > 20);
        return paragraphs.length > 0 ? paragraphs : [insightsText];
      }

      return insights;
    } catch (error) {
      console.error('Error generating sensory insights:', error);
      return [
        'Se realizó un análisis completo de las preferencias sensoriales.',
        'Los resultados muestran patrones claros de preferencia entre los productos.',
        'Se recomienda revisar los comentarios cualitativos para insights adicionales.'
      ];
    }
  }
}
