import { Request, Response } from 'express';
import { ApiError, asyncHandler } from '../utils/errors';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const analyzeComparison = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { colleges } = req.body;
    if (!GEMINI_API_KEY) {
      throw new ApiError(503, 'AI key not configured', 'AI_UNAVAILABLE');
    }
    if (!Array.isArray(colleges) || colleges.length === 0) {
      throw new ApiError(400, 'At least one college is required', 'INVALID_AI_INPUT');
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
    if (!response.ok) {
      throw new ApiError(502, 'AI provider request failed', 'AI_PROVIDER_ERROR');
    }
    const data = await response.json();

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ analysis: aiResponse });
});

export const aiPredictor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rank, exam, category, collegeName, location, cutoffs } = req.body;
    if (!GEMINI_API_KEY) {
      throw new ApiError(503, 'AI key not configured', 'AI_UNAVAILABLE');
    }
    if (!rank || !exam || !collegeName) {
      throw new ApiError(400, 'rank, exam, and collegeName are required', 'INVALID_AI_INPUT');
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
    if (!response.ok) {
      throw new ApiError(502, 'AI provider request failed', 'AI_PROVIDER_ERROR');
    }
    const data = await response.json();

    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    // Clean JSON if needed
    if (aiResponse) {
      aiResponse = aiResponse.replace(/```json|```/g, '').trim();
    }
    
    res.json(JSON.parse(aiResponse || '{}'));
});

const extractGeminiSseText = (chunk: string) => {
  return chunk
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter(Boolean)
    .map((json) => {
      try {
        const parsed = JSON.parse(json);
        return parsed.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join('') || '';
      } catch {
        return '';
      }
    })
    .join('');
};

export const analyzeComparisonStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { colleges } = req.body;
    if (!GEMINI_API_KEY) {
      res.status(503).json({ error: { code: 'AI_UNAVAILABLE', message: 'AI key not configured' } });
      return;
    }
    if (!Array.isArray(colleges) || colleges.length === 0) {
      res.status(400).json({ error: { code: 'INVALID_AI_INPUT', message: 'At least one college is required' } });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

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

    if (!response.ok || !response.body) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'AI provider stream failed' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\n\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        const text = extractGeminiSseText(part);
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    const tail = extractGeminiSseText(buffer);
    if (tail) res.write(`data: ${JSON.stringify({ text: tail })}\n\n`);
    res.write('event: done\ndata: {}\n\n');
    res.end();
  } catch (error) {
    console.error('AI Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: { code: 'AI_STREAM_FAILED', message: 'Stream failed' } });
      return;
    }
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'Stream failed' })}\n\n`);
    res.end();
  }
};
