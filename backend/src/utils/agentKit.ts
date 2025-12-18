import OpenAI from 'openai';
import { Survey, SurveyResponse } from '../models/Survey';
import { SurveyReport } from '../models/Report';
import { QuestionStats } from '../models/Report';

/**
 * OpenAI client initialization with graceful fallback when no API key is provided.
 * This prevents the whole backend from crashing if OPENAI_API_KEY is not set.
 * Supports Cloudflare proxy via OPENAI_PROXY_URL environment variable.
 */
const openaiApiKey = process.env.OPENAI_API_KEY;
let openaiProxyUrl = process.env.OPENAI_PROXY_URL; // e.g., 'https://orange-silence-9576.chiletecnologia2.workers.dev/v1'

// Ensure proxy URL ends with /v1 if provided
if (openaiProxyUrl && !openaiProxyUrl.endsWith('/v1')) {
  openaiProxyUrl = openaiProxyUrl.endsWith('/') 
    ? openaiProxyUrl + 'v1' 
    : openaiProxyUrl + '/v1';
}

let openai: OpenAI | null = null;

if (openaiApiKey) {
  const config: { apiKey: string; baseURL?: string } = {
    apiKey: openaiApiKey,
  };

  // If proxy URL is provided, use it as baseURL (Cloudflare proxy)
  if (openaiProxyUrl) {
    config.baseURL = openaiProxyUrl;
    // eslint-disable-next-line no-console
    console.log('[AgentKit] ✅ Configurando OpenAI con Cloudflare proxy:', openaiProxyUrl);
    // eslint-disable-next-line no-console
    console.log('[AgentKit] API Key configurada:', openaiApiKey.substring(0, 7) + '...');
  } else {
    // eslint-disable-next-line no-console
    console.log('[AgentKit] ⚠️  Usando conexión directa a OpenAI (sin proxy)');
  }

  openai = new OpenAI(config);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[AgentKit] ❌ OPENAI_API_KEY is not set. AI-powered insights will be disabled and basic fallbacks will be used.'
  );
}

export class AgentKitService {
  /**
   * Analyze survey responses using OpenAI to generate insights
   */
  static async generateSurveyInsights(
    survey: Survey,
    responses: SurveyResponse[],
    stats: QuestionStats[]
  ): Promise<string[]> {
    // Fallback when OpenAI is not configured
    if (!openai) {
      return [
        'El análisis con IA está deshabilitado porque no se configuró OPENAI_API_KEY.',
        `Se encontraron ${responses.length} respuestas para la encuesta "${survey.title}".`,
        'Puedes seguir usando las estadísticas básicas del reporte sin problemas.'
      ];
    }

    try {
      const prompt = this.buildInsightsPrompt(survey, responses, stats);

      console.log('[AgentKit] Intentando conectar vía:', openaiProxyUrl || 'Direct connection');
      console.log('[AgentKit] Enviando solicitud a OpenAI...');

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
      console.log('[AgentKit] ✅ Respuesta recibida de OpenAI, longitud:', insightsText.length, 'caracteres');
      return this.parseInsights(insightsText);
    } catch (error) {
      console.error('[AgentKit] ❌ Error generando insights:', error);
      if (error instanceof Error) {
        console.error('[AgentKit] Mensaje de error:', error.message);
      }
      if (error && typeof error === 'object' && 'status' in error) {
        console.error('[AgentKit] HTTP Status:', error.status);
      }
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('[AgentKit] Error Code:', error.code);
      }
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
    // Fallback when OpenAI is not configured
    if (!openai) {
      return {
        sentiment: 'desconocido',
        quality: 'análisis IA deshabilitado',
        notes: 'Configura OPENAI_API_KEY para habilitar el análisis automático.'
      };
    }

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
    // Fallback when OpenAI is not configured
    if (!openai) {
      return `Resumen básico (IA deshabilitada):

Encuesta: ${report.survey_title}
Total de respuestas: ${report.total_responses}

Configura OPENAI_API_KEY en el backend para habilitar resúmenes automáticos con IA.`;
    }

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
    return `Actúa como experto senior en investigación de mercados.

Analiza estos datos de encuesta y genera un INFORME COMPLETO en ESPAÑOL, bien organizado y muy accionable.

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

Devuelve el resultado en el siguiente formato **EXACTO**, usando los marcadores en mayúsculas:

<<<REPORTE_CUANTITATIVO>>>
[texto del reporte cuantitativo sin títulos markdown, solo párrafos y viñetas simples]

<<<MEJOR_OPCION>>>
[texto que explica claramente cuál es la mejor opción/alternativa y por qué]

<<<REPORTE_CUALITATIVO>>>
[texto que resume los comentarios más frecuentes, incluyendo al menos 5 ideas o temas clave]

<<<MEJORAS>>>
[lista clara de 5 a 8 mejoras concretas (pueden ser en formato de viñetas)]

<<<RESUMEN_EJECUTIVO>>>
[párrafo corto que sintetiza todo para un director]
`;
  }

  private static parseInsights(insightsText: string): string[] {
    // Try to parse structured sections using the custom markers
    const sections: Record<string, string> = {};
    const markers = [
      'REPORTE_CUANTITATIVO',
      'MEJOR_OPCION',
      'REPORTE_CUALITATIVO',
      'MEJORAS',
      'RESUMEN_EJECUTIVO',
    ];

    markers.forEach((marker, index) => {
      const regex = new RegExp(
        `<<<${marker}>>>[\\r\\n]+([\\s\\S]*?)(?=<<<|$)`,
        'i'
      );
      const match = insightsText.match(regex);
      if (match && match[1]) {
        sections[marker] = match[1].trim();
      }
    });

    const ordered = [
      sections['REPORTE_CUANTITATIVO'] || '',
      sections['MEJOR_OPCION'] || '',
      sections['REPORTE_CUALITATIVO'] || '',
      sections['MEJORAS'] || '',
      sections['RESUMEN_EJECUTIVO'] || '',
    ].filter((s) => s && s.length > 0);

    if (ordered.length > 0) {
      return ordered;
    }

    // Fallback: if markers are not present, return whole text as single insight
    return [insightsText.trim()];
  }
}
