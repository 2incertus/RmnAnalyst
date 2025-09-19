import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const memoryCache = new Map<string, any>();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file content

// API Routes
app.post('/api/test', (req, res) => {
  console.log('--- TEST API HIT ---');
  console.log('Request Body:', req.body);
  res.status(200).json({ message: 'Test successful', body: req.body });
});

app.post('/api/analyze', async (req, res) => {
  try {
    console.log('--- ANALYZE API HIT ---');
    const { fileContents } = req.body;
    
    if (!fileContents || !Array.isArray(fileContents)) {
      return res.status(400).json({ error: 'Invalid file contents provided' });
    }

    // Combine all file contents
    const combinedContent = fileContents.join('\n\n');

    // Classify document type and set prompt version
    const promptVersion = 'v2-onsite-guardrails-2025-09-18';
    const isOnsite = /\bOn\s*site\b/i.test(combinedContent) || /\bOnsite\b/i.test(combinedContent);
    const isOffsite = /\bOff\s*site\b/i.test(combinedContent) || /\bOffsite\b/i.test(combinedContent);
    const documentType = (isOnsite && !isOffsite) ? 'ONSITE' : (isOffsite && !isOnsite) ? 'OFFSITE' : 'MIXED';

    // Cache key based on content + config
    const hash = crypto.createHash('sha256')
      .update(`${combinedContent}|${documentType}|${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}|${promptVersion}`)
      .digest('hex');
    const cacheKey = `analysis:${hash}`;

    // Try cache first
    try {
      let cached: any = null;
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        cached = await kv.get(cacheKey);
      } else {
        cached = memoryCache.get(cacheKey);
      }
      if (cached && typeof cached === 'object') {
        return res.status(200).json({ ...cached, cacheId: hash });
      }
    } catch (e) {
      console.warn('Cache lookup failed, proceeding to generate analysis', e);
    }
    
    // Extract brand name (onsite or offsite variants)
    let brandName = 'the brand';
    const brandMatch = combinedContent.match(/Brand\s+Name\s+is\s+([A-Za-z0-9\-\&_ ]+)/i);
    if (brandMatch && brandMatch[1]) {
      brandName = brandMatch[1].trim();
    } else {
      const vendorMatch = combinedContent.match(/Reporting\s+Vendor\s+Name\s+is\s+([A-Za-z0-9\-\&_ ]+)/i);
      if (vendorMatch && vendorMatch[1]) {
        brandName = vendorMatch[1].trim();
      } else {
        const nameGuess = combinedContent.match(/\b([A-Z][a-zA-Z0-9\-\&_]+)\b(?=.*Brand\s+ROAS)/);
        if (nameGuess && nameGuess[1]) brandName = nameGuess[1].trim();
      }
    }

    // Build vocabulary whitelist from input to eliminate hallucinations
    const onsiteTerms = [
      'SPA (Product)',
      'Catapult (Native-Fixed)',
      'Banner (Display)',
      'Attributed Sales',
      'Featured ROAS',
      'Halo ROAS',
      'rdROAS',
      'Total Customers',
      '% NTB Customers',
      'AOV'
    ];
    const offsiteTerms = [
      'Paid Social',
      'Paid Search',
      'PLA',
      'DPA',
      'DABA',
      'Brand Revenues',
      'Brand ROAS',
      'NTB%'
    ];
    const genericTerms = [
      'Impressions',
      'Clicks',
      'CTR',
      'CPM',
      'CPC',
      'Orders',
      'Ad Spend',
      'Spend',
      'Revenue',
      'ROAS'
    ];

    const allCandidates = [...onsiteTerms, ...offsiteTerms, ...genericTerms];
    const allowedTerms = allCandidates.filter(term =>
      new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(combinedContent)
    );
    const allowedList = allowedTerms.join(', ') || 'none';

    const channelDirective = documentType === 'ONSITE'
      ? 'For ONSITE documents, analyze by ad item types present in input (e.g., SPA, Catapult, Banner) and KPIs such as Attributed Sales and ROAS. Do NOT use offsite-specific terms unless they appear verbatim in the input.'
      : documentType === 'OFFSITE'
      ? 'For OFFSITE documents, analyze by channel types present in input (e.g., Paid Social, Paid Search) and KPIs such as Brand Revenues and Brand ROAS. Do NOT use onsite-specific terms unless they appear verbatim in the input.'
      : 'For MIXED content, only use terms that appear verbatim in the input; do not introduce any unseen terminology.';

    const vocabularyConstraints = `Document type: ${documentType}
Allowed terms detected: ${allowedList}
Instruction: Only use terms in Allowed list. Do not introduce any other vocabulary.`;

    // Create a high-fidelity prompt with strict grounding to the uploaded text
    const prompt = `
You are a senior retail media analyst. Analyze Petco Retail Media Network performance for the brand ${brandName}. Do NOT refer to Petco as the brand.

${vocabularyConstraints}

${channelDirective}

Hard constraints:
- Ground every statement strictly in the provided input only. No assumptions.
- Use only terms from the Allowed list above.
- Quantify all claims with exact values and percentage deltas shown in the input (e.g., vs LM, vs benchmark).
- Call out week/campaign specifics where present with exact values and deltas vs benchmark.
- Provide concrete, tactical recommendations grounded in the observed data (budget reallocation, creative, targeting, bidding, keywords).
- Return strictly valid JSON only (no markdown). Use the exact key names shown in the schema below.

JSON schema (shape only):
{
  "executiveSummary": string,
  "kpiHighlights": { "positive": string[], "negative": string[] },
  "benchmarkComparison": string,
  "kpiTrends": [
    { "metric": string, "data": [ { "period": string, "value": number } ] }
  ],
  "topPerformers": [
    { "name": string, "metric": string, "value": string, "description": string }
  ],
  "bottomPerformers": [
    { "name": string, "metric": string, "value": string, "description": string }
  ],
  "actionableRecommendations": string[],
  "petcoContextualization": string
}

Input reports (analyze only the following text; do not use external knowledge):
${combinedContent}
    `;

    // Get the generative model (allow env override to gemini-2.5-pro)
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Generate JSON response (enforce JSON via MIME type; schema removed due to SDK typing)
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    let analysis;
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        analysis = JSON.parse(jsonString);
      } else {
        throw new Error('No valid JSON found in the response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', text);
      
      // Return a fallback response if parsing fails
      analysis = {
        executiveSummary: "We encountered an issue processing the AI analysis. Please try again or contact support.",
        kpiHighlights: {
          positive: ["Unable to process data"],
          negative: ["Analysis error occurred"]
        },
        benchmarkComparison: "Unable to compare due to processing error",
        kpiTrends: [],
        topPerformers: [],
        bottomPerformers: [],
        actionableRecommendations: ["Please try uploading your files again"],
        petcoContextualization: "Unable to provide context due to processing error"
      };
    }

    // Validate forbidden vocabulary usage; retry once if violated
    const allCandidates2 = [
      // Keep in sync with candidate lists used to build allowedTerms
      'SPA (Product)','Catapult (Native-Fixed)','Banner (Display)','Attributed Sales','Featured ROAS','Halo ROAS','rdROAS','Total Customers','% NTB Customers','AOV',
      'Paid Social','Paid Search','PLA','DPA','DABA','Brand Revenues','Brand ROAS','NTB%',
      'Impressions','Clicks','CTR','CPM','CPC','Orders','Ad Spend','Spend','Revenue','ROAS'
    ];
    // allowedTerms was computed earlier from combinedContent
    const forbiddenCandidates = allCandidates2.filter(t => !allowedTerms.includes(t));
    const violates = (s: string, terms: string[]) =>
      terms.some(t => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(s));

    let analysisJsonStr = JSON.stringify(analysis);
    if (violates(analysisJsonStr, forbiddenCandidates)) {
      const forbidList = forbiddenCandidates.join(', ');
      const retryPrompt = `${prompt}

Critical rule: Do not use any of the following terms unless they appear verbatim in the input: ${forbidList}
If any forbidden terms appear in your JSON, your response is invalid. Regenerate strictly using only allowed terms.`;

      const retryResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: retryPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const retryText = (await retryResult.response).text();
      try {
        const jsonMatch2 = retryText.match(/```json\n([\s\S]*?)\n```/) || retryText.match(/\{[\s\S]*\}/);
        if (!jsonMatch2) throw new Error('No JSON found on retry');
        const jsonString2 = jsonMatch2[1] || jsonMatch2[0];
        const analysis2 = JSON.parse(jsonString2);
        const analysis2Str = JSON.stringify(analysis2);
        if (violates(analysis2Str, forbiddenCandidates)) {
          return res.status(422).json({
            error: 'Generated analysis references terms not present in the uploaded documents',
            documentType,
            allowed: allowedTerms,
            cacheId: hash
          });
        }
        analysis = analysis2;
      } catch (e) {
        return res.status(422).json({
          error: 'Failed to produce analysis strictly grounded in uploaded documents',
          documentType,
          allowed: allowedTerms,
          cacheId: hash
        });
      }
    }

    // Save to cache and return id
    try {
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await kv.set(cacheKey, analysis, { ex: 60 * 60 * 24 * 7 }); // 7 days
      } else {
        memoryCache.set(cacheKey, analysis);
      }
    } catch (e) {
      console.error('Cache store failed', e);
    }
    res.status(200).json({ ...analysis, cacheId: hash });
  } catch (error) {
    console.error('Error in analyze API:', error);
    res.status(500).json({ error: 'Failed to analyze files' });
  }
});

 // Retrieve a saved analysis by id
 app.get('/api/analysis/:id', async (req, res) => {
   const id = req.params.id;
   const cacheKey = `analysis:${id}`;
   try {
     let data: any = null;
     if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
       data = await kv.get(cacheKey);
     } else {
       data = memoryCache.get(cacheKey);
     }
     if (!data) return res.status(404).json({ error: 'Not found' });
     return res.status(200).json({ ...data, cacheId: id });
   } catch (e) {
     console.error('Cache read failed', e);
     return res.status(500).json({ error: 'Failed to read analysis' });
   }
 });

 // Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});