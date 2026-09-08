import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateDeepStatisticalInterpretation(query: string, context: any): Promise<string> {
  const client = getAiClient();

  const systemInstruction = `You are a Senior Principal Statistician, Econometrician, and Data Scientist.
Your role is to provide rigorous, clear, and mathematically accurate statistical interpretations for the Statistical Analytics Studio software.

Strict Statistical Rules:
1. Never claim correlation implies causation unless the design strictly allows causal inference. Clearly distinguish association from causation.
2. Never say "accept H₀" or "accept the null hypothesis". Always use "fail to reject H₀".
3. Report and reference exact p-values, degrees of freedom, sample sizes, and effect sizes where available.
4. Distinguish statistical significance (p-value < alpha) from practical/substantive significance (effect size, business impact).
5. Always address regression assumptions: Linearity, Normality of residuals, Homoscedasticity, Multicollinearity (VIF), and Autocorrelation.
6. Provide structured headings: Executive Finding, Statistical Evaluation, Methodological Caveats, and Actionable Recommendations.`;

  const userContent = `STATISTICAL CONTEXT:
${JSON.stringify(context, null, 2)}

USER QUESTION / TASK:
${query}

Please formulate an exhaustive, deeply reasoned statistical report and interpretation.`;

  // First try gemini-3.1-pro-preview with ThinkingLevel.HIGH as requested
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userContent,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });
    return response.text || 'No response generated.';
  } catch (err: any) {
    console.warn('gemini-3.1-pro-preview error, falling back to gemini-3.8-flash:', err?.message);
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userContent,
        config: {
          systemInstruction,
        },
      });
      return response.text || 'No response generated.';
    } catch (fallbackErr: any) {
      console.error('All Gemini model calls failed:', fallbackErr);
      throw new Error(`AI interpretation unavailable: ${fallbackErr.message}`);
    }
  }
}
