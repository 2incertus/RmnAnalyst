import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { GoogleGenAI, Type } from "@google/genai";
import { createHash } from 'crypto';

// --- Copied from types.ts ---
export interface TrendDataPoint {
  period: string;
  value: number;
}

export interface KpiTrend {
  metric: string;
  data: TrendDataPoint[];
}

export interface Performer {
  name: string;
  metric: string;
  value: string;
  description: string;
}

export interface AnalysisResult {
  executiveSummary: string;
  kpiHighlights: {
    positive: string[];
    negative: string[];
  };
  benchmarkComparison: string;
  kpiTrends: KpiTrend[];
  topPerformers: Performer[];
  bottomPerformers: Performer[];
  actionableRecommendations: string[];
  petcoContextualization: string;
}
// --- End of copied types ---

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: "A high-level summary (2-3 sentences) of the overall performance for the identified brand across the provided reports, mentioning the most significant trend or finding.",
    },
    kpiHighlights: {
      type: Type.OBJECT,
      properties: {
        positive: { type: Type.ARRAY, description: "A list of 2-4 key positive performance indicators or trends.", items: { type: Type.STRING } },
        negative: { type: Type.ARRAY, description: "A list of 2-4 key areas for improvement or negative trends.", items: { type: Type.STRING } },
      },
      required: ["positive", "negative"]
    },
    benchmarkComparison: {
      type: Type.STRING,
      description: "A paragraph analyzing the identified brand's performance (ROAS, CTR, CVR) against the provided category benchmarks."
    },
    kpiTrends: {
      type: Type.ARRAY,
      description: "An array of objects containing time-series data for key metrics like 'Attributed ROAS' and 'Attributed Sales'. Extract the fiscal period (e.g., '202506') as the 'period' and the corresponding numeric value.",
      items: {
        type: Type.OBJECT,
        properties: {
          metric: { type: Type.STRING, description: "The name of the KPI, e.g., 'Attributed ROAS'." },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING, description: "The fiscal period, e.g., '202506'." },
                value: { type: Type.NUMBER, description: "The numeric value of the metric for that period." }
              },
              required: ["period", "value"]
            }
          }
        },
        required: ["metric", "data"]
      }
    },
    topPerformers: {
        type: Type.ARRAY,
        description: "A list of the top 3 performing ad items or products based on ROAS or Attributed Sales.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the campaign/product." },
                metric: { type: Type.STRING, description: "The metric used for ranking, e.g., 'ROAS'." },
                value: { type: Type.STRING, description: "The value of the metric, e.g., '15.2' or '$2.1K'." },
                description: { type: Type.STRING, description: "A brief explanation of why it's a top performer." }
            },
            required: ["name", "metric", "value", "description"]
        }
    },
    bottomPerformers: {
        type: Type.ARRAY,
        description: "A list of the bottom 3 performing ad items or products based on ROAS or high spend with low return.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the campaign/product." },
                metric: { type: Type.STRING, description: "The metric used for ranking, e.g., 'ROAS'." },
                value: { type: Type.STRING, description: "The value of the metric, e.g., '0.9' or '$500 spend'." },
                description: { type: Type.STRING, description: "A brief explanation of why it's an underperformer." }
            },
            required: ["name", "metric", "value", "description"]
        }
    },
    actionableRecommendations: {
      type: Type.ARRAY,
      description: "A list of 3-5 specific, actionable steps tailored to the identified brand and the Petco platform to improve performance.",
      items: { type: Type.STRING }
    },
    petcoContextualization: {
      type: Type.STRING,
      description: "A narrative paragraph that contextualizes the performance against general market trends in the pet retail category. Consider seasonality (e.g., holiday season, flea and tick season) and how e-commerce trends might impact media performance for this specific brand."
    }
  },
  required: ["executiveSummary", "kpiHighlights", "benchmarkComparison", "kpiTrends", "topPerformers", "bottomPerformers", "actionableRecommendations", "petcoContextualization"]
};

const analyzeMediaData = async (fileContents: string[]): Promise<AnalysisResult> => {
  const dataBlobs = fileContents.map((content, index) => `
--- START OF REPORT ${index + 1} ---
${content}
--- END OF REPORT ${index + 1} ---
  `).join('\n\n');

  const prompt = `
    You are an expert performance analyst for Petco's Retail Media Network (RMN). Your task is to analyze one or more monthly performance reports for a specific brand on petco.com and provide a comprehensive, structured analysis in JSON format.

    Here is the data from the monthly report(s):
    ${dataBlobs}

    Analyze the provided data with the following focus:
    1.  **Brand Identification**: Critically examine the start of the document(s) to find the brand name. Look for labels like "Brand:", "Advertiser:", or a company name mentioned in the header. The brand is the entity whose products are being advertised, not the retailer (Petco) or agency. This is the most crucial first step.
    2.  **Contextual Analysis**: For the identified brand, infer its general market position (e.g., premium, value, specialty), primary product types, and likely target audience based on the product names and performance data. Use this context to inform your entire analysis.
    3.  **KPI Trends**: Extract time-series data for 'Attributed ROAS' and 'Attributed Sales'. Use the 'Fiscal Period' from each report as the time identifier.
    4.  **Performance Tiers**: Identify the top 3 and bottom 3 performing 'Ad Items' from the 'Ad Item Performance' tables. Use ROAS as the primary ranking metric. Analyze why these items are performing at their respective levels.
    5.  **Market Context**: In your 'petcoContextualization' analysis, compare the brand's performance to general market trends for its likely category (e.g., premium cat food, dog toys, etc.). Consider how the brand's performance might be affected by seasonality or broader e-commerce trends.
    6.  **Actionable Insights**: Provide recommendations that are specific to the identified brand and tailored for the Petco platform. For example, suggest targeting strategies, budget adjustments, or creative optimizations based on the performance data.

    Please return your findings strictly following the provided JSON schema. Ensure all fields are populated with insightful analysis that reflects the identified brand's unique context and performance.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonText);
    
    if (!result.executiveSummary || !result.kpiTrends || !result.topPerformers || !result.actionableRecommendations) {
        throw new Error("The AI response is missing required fields.");
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
      throw new Error("The request was blocked due to safety settings. Please check your input data.");
    }
    throw new Error("Failed to get a valid analysis from the AI. The model may have returned an unexpected format.");
  }
};


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileContents } = req.body;

  if (!Array.isArray(fileContents) || fileContents.length === 0) {
    return res.status(400).json({ error: 'File contents must be a non-empty array.' });
  }

  const cacheKey = createHash('sha256').update(JSON.stringify(fileContents)).digest('hex');

  try {
    const cachedResult = await kv.get<AnalysisResult>(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }
  } catch (error) {
    console.error("Error accessing cache:", error);
  }

  try {
    const result = await analyzeMediaData(fileContents);
    
    try {
      await kv.set(cacheKey, result, { ex: 3600 }); // Cache for 1 hour
    } catch (error) {
      console.error("Error saving to cache:", error);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return res.status(500).json({ error: `Analysis failed: ${errorMessage}` });
  }
}