import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file content
app.use(express.static(path.join(__dirname, 'dist'))); // Serve static files from dist directory

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

    // For now, return a mock response
    // In a real implementation, this would call the Google AI API
    const mockAnalysis = {
      executiveSummary: "This is a mock analysis of the provided retail media data. The implementation would integrate with Google's Gemini AI API to provide actual insights.",
      keyFindings: [
        "Finding 1: Performance metrics show positive trends",
        "Finding 2: There are opportunities for optimization",
        "Finding 3: Seasonal factors appear to influence results"
      ],
      recommendations: [
        "Recommendation 1: Increase budget for high-performing campaigns",
        "Recommendation 2: Optimize ad creative for better engagement",
        "Recommendation 3: Leverage seasonal trends in planning"
      ],
      trends: [
        { month: 'June', sales: 12000, spend: 3000 },
        { month: 'July', sales: 15000, spend: 3500 }
      ]
    };

    res.status(200).json(mockAnalysis);
  } catch (error) {
    console.error('Error in analyze API:', error);
    res.status(500).json({ error: 'Failed to analyze files' });
  }
});

// Serve the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});