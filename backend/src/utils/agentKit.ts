import OpenAI from 'openai';
import { Survey, SurveyResponse } from '../models/Survey';
import { SurveyReport } from '../models/Report';
import { QuestionStats } from '../models/Report';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AgentKitService {
  /**
   * Analyze survey responses using OpenAI to generate insights
   */
  static async generateSurveyInsights(
    survey: Survey,
    responses: SurveyResponse[],
    stats: QuestionStats[]
  ): Promise<string[]> {
    try {
      const prompt = this.buildInsightsPrompt(survey, responses, stats);

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Eres un analista de datos experto especializado en análisis de encuestas. Proporciona insights accionables basados en respuestas de encuestas. TODAS tus respuestas deben estar en ESPAÑOL, ya que los usuarios son de habla hispana."
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
      return this.parseInsights(insightsText);
    } catch (error) {
      console.error('Error generating insights with AgentKit:', error);
      return ['No se pudieron generar insights en este momento.'];
    }
  }

  /**
   * Process a survey response and extract metadata using AI
   */
  static async processSurveyResponse(
    survey: Survey,
    response: SurveyResponse
  ): Promise<Record<string, any>> {
    try {
      const prompt = `Analiza esta respuesta de encuesta y extrae metadatos relevantes, sentimiento o patrones:

Encuesta: ${survey.title}
Preguntas: ${JSON.stringify(survey.questions)}
Respuesta: ${JSON.stringify(response.responses)}

Por favor proporciona en ESPAÑOL:
1. Sentimiento general (positivo/negativo/neutral)
2. Temas o tópicos clave mencionados
3. Cualquier sugerencia o retroalimentación proporcionada
4. Evaluación de la calidad de la respuesta

Formato como JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const metadataText = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(metadataText);
    } catch (error) {
      console.error('Error processing response with AgentKit:', error);
      return {};
    }
  }

  /**
   * Generate a summary report using AI
   */
  static async generateReportSummary(report: SurveyReport): Promise<string> {
    try {
      const prompt = `Crea un resumen completo de este reporte de encuesta en ESPAÑOL:

Encuesta: ${report.survey_title}
Respuestas Totales: ${report.total_responses}
Tasa de Finalización: ${(report.completion_rate * 100).toFixed(1)}%

Estadísticas Clave:
${report.questions_stats.map(stat =>
  `- ${stat.question_text}: ${stat.total_responses} respuestas`
).join('\n')}

Por favor proporciona un resumen profesional destacando los hallazgos más importantes.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Eres un analista profesional de encuestas. Crea resúmenes claros y accionables de los resultados de encuestas en ESPAÑOL."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.5
      });

      return completion.choices[0]?.message?.content || 'Resumen no disponible.';
    } catch (error) {
      console.error('Error generating report summary:', error);
      return 'No se pudo generar el resumen en este momento.';
    }
  }

  private static buildInsightsPrompt(
    survey: Survey,
    responses: SurveyResponse[],
    stats: QuestionStats[]
  ): string {
    return `Por favor analiza estos datos de encuesta y proporciona insights clave en ESPAÑOL:

Título de la Encuesta: ${survey.title}
Descripción: ${survey.description || 'Sin descripción proporcionada'}
Respuestas Totales: ${responses.length}

Estadísticas de Preguntas:
${stats.map((stat: QuestionStats) => `
Pregunta: ${stat.question_text}
Respuestas Totales: ${stat.total_responses}
${stat.average_rating ? `Calificación Promedio: ${stat.average_rating.toFixed(1)}` : ''}
Distribución de Respuestas: ${JSON.stringify(stat.response_distribution)}
`).join('\n')}

Respuestas de Ejemplo:
${responses.slice(0, 5).map((r, i) => `
Respuesta ${i + 1}: ${JSON.stringify(r.responses)}
`).join('\n')}

Por favor proporciona 3-5 insights clave sobre:
1. Satisfacción general o sentimiento
2. Temas o patrones comunes
3. Áreas de preocupación o mejora
4. Aspectos positivos destacados
5. Cualquier correlación o tendencia`;
  }

  private static parseInsights(insightsText: string): string[] {
    // Split insights by numbered points or bullet points
    const insights = insightsText
      .split(/\d+\.|\*\s*|•\s*/)
      .map(insight => insight.trim())
      .filter(insight => insight.length > 10); // Filter out very short items

    return insights.length > 0 ? insights : [insightsText];
  }
}
