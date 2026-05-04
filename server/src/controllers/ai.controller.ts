import { Request, Response } from 'express';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const analyzeComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { colleges } = req.body;
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: 'AI key not configured' });
      return;
    }

    const collegeDataStr = colleges.map((c: any) => 
      `${c.name}: Rating ${c.rating}, Fees ${c.fees}, Programs ${c.details?.programs}, Cutoff ${c.cutoffs?.[0]?.maxRank}`
    ).join(' | ');

    const prompt = `You are a professional college counselor. Analyze these colleges for a student: ${collegeDataStr}. 
    Highlight the pros and cons of each and recommend the best one based on different student priorities (budget, reputation, academics). Keep it concise and professional.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ analysis: aiResponse });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: 'AI Analysis failed' });
  }
};

export const aiPredictor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rank, exam, category, collegeName, location, cutoffs } = req.body;
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: 'AI key not configured' });
      return;
    }

    const prompt = `As an AI College Admissions Expert, predict the admission probability for a student with the following details:
    - Student Rank: ${rank}
    - Exam: ${exam}
    - Category: ${category}
    - Target College: ${collegeName} (${location})
    - Historical Cutoffs: ${JSON.stringify(cutoffs)}

    Based on this data, provide:
    1. A probability percentage (0-100).
    2. A short professional assessment of their chances.
    3. Any advice for their counseling process.
    
    Format your response as a JSON object: {"percent": number, "assessment": "string", "advice": "string"}. Return ONLY the JSON.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();

    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    // Clean JSON if needed
    if (aiResponse) {
      aiResponse = aiResponse.replace(/```json|```/g, '').trim();
    }
    
    res.json(JSON.parse(aiResponse));
  } catch (error) {
    console.error('AI Prediction Error:', error);
    res.status(500).json({ error: 'AI Prediction failed' });
  }
};
export const analyzeComparisonStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { colleges } = req.body;
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: 'AI key not configured' });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const collegeDataStr = colleges.map((c: any) => 
      `${c.name}: Rating ${c.rating}, Fees ${c.fees}, Programs ${c.details?.programs}, Cutoff ${c.cutoffs?.[0]?.maxRank}`
    ).join(' | ');

    const prompt = `You are a professional college counselor. Analyze these colleges for a student: ${collegeDataStr}. 
    Highlight the pros and cons of each and recommend the best one based on different student priorities (budget, reputation, academics). Keep it concise and professional. Use markdown.`;

    const STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const response = await fetch(STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.body) {
      res.write('data: {"error": "No stream body"}\n\n');
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (error) {
    console.error('AI Stream Error:', error);
    res.write('data: {"error": "Stream failed"}\n\n');
    res.end();
  }
};
