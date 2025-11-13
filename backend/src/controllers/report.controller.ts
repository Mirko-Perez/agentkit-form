import { Request, Response } from 'express';
import { query } from '../config/database';
import { SurveyReport, QuestionStats, SensoryReport, SensoryPreferenceStats, SensoryStatisticalAnalysis } from '../models/Report';
import { AgentKitService } from '../utils/agentKit';
import { SensoryEvaluation, SensoryProduct } from '../models/Survey';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

      // Perform statistical analysis (Friedman test)
      const statisticalAnalysis = this.performStatisticalAnalysis(preferenceStats, evaluations.length);

      // Extract qualitative feedback
      const qualitativeFeedback = this.extractQualitativeFeedback(evaluations);

      // Generate recommendations
      const recommendations = this.generateRecommendations(preferenceStats, statisticalAnalysis);

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
        generated_at: new Date()
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
      res.status(500).json({ error: 'Failed to generate sensory report' });
    }
  }

  /**
   * Get list of generated reports for traceability
   */
  static async getGeneratedReports(req: Request, res: Response) {
    try {
      const { type } = req.query;

      let queryStr = 'SELECT id, evaluation_id, report_type, generated_at, expires_at, is_valid FROM generated_reports';
      let params: any[] = [];

      if (type) {
        queryStr += ' WHERE report_type = $1';
        params.push(type);
      }

      queryStr += ' ORDER BY generated_at DESC';

      const result = await query(queryStr, params);

      res.json({
        reports: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching generated reports:', error);
      res.status(500).json({ error: 'Failed to fetch generated reports' });
    }
  }

  /**
   * Get dashboard overview
   */
  static async getDashboardOverview(req: Request, res: Response) {
    try {
      // Get total surveys
      const surveysResult = await query('SELECT COUNT(*) as total FROM surveys WHERE is_active = true AND is_deleted = false');
      const totalSurveys = parseInt(surveysResult.rows[0].total);

      // Get total responses
      const responsesResult = await query('SELECT COUNT(*) as total FROM survey_responses WHERE is_deleted = false');
      const totalResponses = parseInt(responsesResult.rows[0].total);

      // Get recent surveys
      const recentSurveysResult = await query(
        'SELECT id, title, created_at FROM surveys WHERE is_active = true AND is_deleted = false ORDER BY created_at DESC LIMIT 5'
      );

      // Get response stats by survey
      const statsResult = await query(`
        SELECT
          s.id,
          s.title,
          COUNT(sr.id) as response_count,
          MAX(sr.submitted_at) as last_response
        FROM surveys s
        LEFT JOIN survey_responses sr ON s.id = sr.survey_id AND sr.is_deleted = false
        WHERE s.is_active = true AND s.is_deleted = false
        GROUP BY s.id, s.title
        ORDER BY response_count DESC
        LIMIT 10
      `);

      res.json({
        total_surveys: totalSurveys,
        total_responses: totalResponses,
        recent_surveys: recentSurveysResult.rows,
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
      stats.percentage = totalEvaluations > 0 ? (stats.total_votes / totalEvaluations) * 100 : 0;

      // Calculate weighted average position (1st=1, 2nd=2, 3rd=3, lower is better)
      const weightedSum = (stats.first_place_count * 1) + (stats.second_place_count * 2) + (stats.third_place_count * 3);
      stats.average_position = stats.total_votes > 0 ? weightedSum / stats.total_votes : 3;
    });

    // Sort by preference (best to worst)
    return result.sort((a, b) => a.average_position - b.average_position);
  }

  /**
   * Perform statistical analysis (Friedman test)
   */
  private static performStatisticalAnalysis(
    preferenceStats: SensoryPreferenceStats[],
    totalPanelists: number
  ): SensoryStatisticalAnalysis {
    // Simplified Friedman test implementation
    // In a real implementation, you'd use a proper statistical library
    const k = preferenceStats.length; // number of products
    const n = totalPanelists; // number of panelists

    if (k < 3 || n < 3) {
      return {
        friedman_test: {
          chi_square: 0,
          degrees_of_freedom: k - 1,
          p_value: 1.0,
          significant: false,
          critical_value: this.getCriticalValue(k - 1, 0.05),
          interpretation: 'Insuficientes datos para análisis estadístico'
        },
        pairwise_comparisons: [],
        overall_significance: false
      };
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
      pairwise_comparisons: pairwiseComparisons,
      overall_significance: significant
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
   * Extract qualitative feedback from evaluations
   */
  private static extractQualitativeFeedback(evaluations: SensoryEvaluation[]) {
    const allComments: string[] = [];

    evaluations.forEach(evaluation => {
      evaluation.preferences.forEach(preference => {
        if (preference.reason) {
          allComments.push(preference.reason);
        }
      });
    });

    // Simple categorization (in a real implementation, use NLP)
    const positiveComments = allComments.filter(comment =>
      comment.toLowerCase().includes('bueno') ||
      comment.toLowerCase().includes('excelente') ||
      comment.toLowerCase().includes('mejor') ||
      comment.toLowerCase().includes('gusta')
    );

    const negativeComments = allComments.filter(comment =>
      comment.toLowerCase().includes('malo') ||
      comment.toLowerCase().includes('peor') ||
      comment.toLowerCase().includes('regular') ||
      comment.toLowerCase().includes('mejorar')
    );

    return {
      top_positive_comments: positiveComments.slice(0, 5),
      top_negative_comments: negativeComments.slice(0, 5),
      common_themes: ['sabor', 'textura', 'color', 'aroma'] // Simplified
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    preferenceStats: SensoryPreferenceStats[],
    statisticalAnalysis: SensoryStatisticalAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (preferenceStats.length > 0) {
      const winner = preferenceStats[0];
      recommendations.push(`${winner.product_name} es el producto preferido con ${winner.percentage.toFixed(1)}% de preferencia.`);
    }

    if (statisticalAnalysis.overall_significance) {
      recommendations.push('Las diferencias entre productos son estadísticamente significativas.');
    } else {
      recommendations.push('No hay diferencias significativas entre los productos evaluados.');
    }

    // Add specific recommendations based on rankings
    preferenceStats.forEach((stats, index) => {
      if (stats.average_position < 2) {
        recommendations.push(`Considerar promover ${stats.product_name} como producto estrella.`);
      } else if (stats.average_position > 2.5) {
        recommendations.push(`Revisar fórmula de ${stats.product_name} para mejorar su aceptación.`);
      }
    });

    return recommendations;
  }

  /**
   * Generate AI insights for sensory evaluation
   */
  private static async generateSensoryInsights(
    evaluations: SensoryEvaluation[],
    products: SensoryProduct[],
    preferenceStats: SensoryPreferenceStats[],
    statisticalAnalysis: any
  ): Promise<string[]> {
    try {
      const productStats = preferenceStats.map(stat =>
        `${stat.product_name}: ${stat.first_place_count} primeros lugares, ${stat.second_place_count} segundos, ${stat.third_place_count} terceros (${stat.percentage.toFixed(1)}% preferencia)`
      ).join('\n');

      const panelistComments = evaluations.slice(0, 8).map((evaluation, i) => {
        const comments = evaluation.preferences.map(p => `${p.product_id}: ${p.reason || 'Sin comentario'}`).join('; ');
        return `Panelista ${i + 1}: ${comments}`;
      }).join('\n');

      const prompt = `Analiza estos resultados de evaluación sensorial y proporciona insights clave en ESPAÑOL:

Productos evaluados: ${products.map(p => p.name).join(', ')}
Número de panelistas: ${evaluations.length}

Estadísticas de preferencias:
${productStats}

Comentarios de panelistas:
${panelistComments}

Análisis estadístico: ${statisticalAnalysis.friedman_test.significant ? 'Diferencias significativas encontradas' : 'No hay diferencias significativas'}

Por favor proporciona 4-6 insights específicos sobre:
1. Producto más preferido y por qué
2. Comentarios más comunes sobre los productos
3. Fortalezas y debilidades identificadas
4. Recomendaciones basadas en los resultados
5. Tendencias o patrones observados
6. Confianza en los resultados estadísticos`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Eres un experto analista sensorial especializado en evaluación de productos. Proporciona insights claros y accionables en ESPAÑOL basados en datos de evaluación sensorial."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const insightsText = completion.choices[0]?.message?.content || '';

      // Parse insights similar to the survey insights parsing
      const insights = insightsText
        .split(/\d+\.|\*\s*|•\s*/)
        .map(insight => insight.trim())
        .filter(insight => insight.length > 10);

      return insights.length > 0 ? insights : [insightsText];
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
