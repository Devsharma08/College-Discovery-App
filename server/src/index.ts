import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; payload: unknown }>();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '64kb' }));

const getCached = <T>(key: string): T | null => {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.payload as T;
};

const setCached = (key: string, payload: unknown) => {
  cache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
};

const toPositiveInt = (value: unknown, fallback: number, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(Math.floor(parsed), max);
};

const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();

const isExamMatch = (cutoffExam: string, selectedExam: string) => {
  const cutoff = normalizeText(cutoffExam);
  const selected = normalizeText(selectedExam);
  if (!selected) return true;
  if (cutoff === selected || cutoff.includes(selected) || selected.includes(cutoff)) return true;

  const aliases: Record<string, string[]> = {
    entrance: ['general entrance', 'entrance', 'common entrance'],
    jee: ['jee', 'jee mains', 'jee main'],
    neet: ['neet'],
    met: ['met'],
  };

  return Object.values(aliases).some((group) => group.includes(cutoff) && group.includes(selected));
};

type CollegeWithCutoffs = Awaited<ReturnType<typeof prisma.college.findMany>>[number] & {
  cutoffs: Array<{ examName: string; maxRank: number; category?: string | null }>;
};

const getBestCutoffForRank = (college: CollegeWithCutoffs, exam: string, category: string, rank: number) => {
  const normalizedCategory = normalizeText(category);
  const categoryMatches = (cutoff: { category?: string | null }) =>
    !normalizedCategory || normalizeText(cutoff.category || 'General') === normalizedCategory;

  const examCutoffs = college.cutoffs.filter((cutoff) => isExamMatch(cutoff.examName, exam));
  const preferredCutoffs = examCutoffs.filter(categoryMatches);
  const fallbackCutoffs = preferredCutoffs.length > 0
    ? preferredCutoffs
    : examCutoffs.length > 0
      ? examCutoffs
      : college.cutoffs.filter(categoryMatches).length > 0
        ? college.cutoffs.filter(categoryMatches)
        : college.cutoffs;

  return [...fallbackCutoffs].sort((a, b) => {
    const aReachable = a.maxRank >= rank ? 0 : 1;
    const bReachable = b.maxRank >= rank ? 0 : 1;
    if (aReachable !== bReachable) return aReachable - bReachable;
    return Math.abs(a.maxRank - rank) - Math.abs(b.maxRank - rank);
  })[0];
};

const getPredictionPercent = (rank: number, cutoffRank: number) => {
  const diff = cutoffRank - rank;
  const clamp = (value: number) => Math.max(5, Math.min(95, Math.round(value)));
  if (diff > 2000) return 95;
  if (diff > 0) return clamp(80 + (diff / 2000) * 15);
  if (diff > -500) return clamp(50 + (diff / 500) * 20);
  if (diff > -2000) return clamp(20 + (diff / 2000) * 30);
  return clamp(18 - Math.min(Math.abs(diff), 20_000) / 1600);
};

const getMatchReason = (percent: number, examName: string, cutoffRank: number) => {
  if (percent >= 80) return `Strong match against the available ${examName} cutoff of rank ${cutoffRank}.`;
  if (percent >= 50) return `Close but realistic option against the available ${examName} cutoff of rank ${cutoffRank}.`;
  if (percent >= 20) return `Stretch option; the nearest available ${examName} cutoff is rank ${cutoffRank}.`;
  return `Ambitious option; nearest available ${examName} cutoff is rank ${cutoffRank}.`;
};

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  next();
});

// 1. College Listing + Search
app.get('/api/colleges', async (req, res) => {
  try {
    const { search, state, city } = req.query;
    const take = toPositiveInt(req.query.limit, 60);
    const skip = toPositiveInt(req.query.offset, 0, 10_000);
    const cacheKey = `colleges:${search ?? ''}:${state ?? ''}:${city ?? ''}:${take}:${skip}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const colleges = await prisma.college.findMany({
      where: {
        AND: [
          search ? { name: { contains: String(search), mode: 'insensitive' } } : {},
          state ? { state: String(state) } : {},
          city ? { city: String(city) } : {},
        ]
      },
      take,
      skip,
      orderBy: { rating: 'desc' },
      include: {
        details: true
      }
    });

    setCached(cacheKey, colleges);
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// 2. College Detail Page
app.get('/api/colleges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `college:${id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        details: true,
        cutoffs: true
      }
    });

    if (!college) return res.status(404).json({ error: 'College not found' });
    setCached(cacheKey, college);
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch college details' });
  }
});

// 3. Simple Predictor Tool
app.get('/api/predictor', async (req, res) => {
  try {
    const { rank, exam, category = 'General' } = req.query;
    if (!rank || !exam) return res.status(400).json({ error: 'Rank and exam are required' });
    const parsedRank = toPositiveInt(rank, 0, 1_000_000);
    if (parsedRank <= 0) return res.status(400).json({ error: 'Rank must be a positive number' });

    const cacheKey = `predictor:v2:${exam}:${parsedRank}:${category}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const candidates = await prisma.college.findMany({
      where: {
        cutoffs: {
          some: {}
        }
      },
      include: {
        cutoffs: true,
        details: true
      },
      take: 100
    });

    const results = candidates
      .map((college) => {
        const cutoff = getBestCutoffForRank(college, String(exam), String(category), parsedRank);
        if (!cutoff) return null;

        const percent = getPredictionPercent(parsedRank, cutoff.maxRank);
        const reachableBoost = cutoff.maxRank >= parsedRank ? 0 : 10_000;
        const score = reachableBoost + Math.abs(cutoff.maxRank - parsedRank) - (college.rating * 120);

        return {
          ...college,
          matchedCutoff: cutoff,
          matchPercent: percent,
          aiMatchReason: getMatchReason(percent, cutoff.examName, cutoff.maxRank),
          _score: score,
        };
      })
      .filter((college): college is NonNullable<typeof college> => Boolean(college))
      .sort((a, b) => a._score - b._score)
      .slice(0, 18)
      .map(({ _score, ...college }) => college);

    setCached(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error('Predictor Error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// 4. Compare Colleges
app.post('/api/compare', async (req, res) => {
  try {
    const { collegeIds } = req.body; // Array of IDs
    if (!collegeIds || !Array.isArray(collegeIds)) return res.status(400).json({ error: 'collegeIds must be an array' });
    const ids = collegeIds.filter((id): id is string => typeof id === 'string').slice(0, 3);
    const cacheKey = `compare:${ids.sort().join(',')}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const colleges = await prisma.college.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        details: true,
        cutoffs: true
      }
    });

    setCached(cacheKey, colleges);
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: 'Comparison failed' });
  }
});

// Helper to get or create a guest user (since schema requires an author)
const getGuestUser = async () => {
  const guest = await prisma.user.findFirst({ where: { username: 'Guest' } });
  if (guest) return guest;
  return prisma.user.create({
    data: {
      username: 'Guest',
    }
  });
};

// 4. Q&A System - Get questions
app.get('/api/colleges/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const questions = await prisma.question.findMany({
      where: { collegeId: id },
      include: {
        author: true,
        answers: { include: { author: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// 5. Q&A System - Post a question
app.post('/api/colleges/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const guest = await getGuestUser();

    const question = await prisma.question.create({
      data: {
        text,
        collegeId: id,
        authorId: guest.id
      }
    });

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post question' });
  }
});

// 6. Q&A System - Post an answer
app.post('/api/questions/:questionId/answers', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;
    const guest = await getGuestUser();

    const answer = await prisma.answer.create({
      data: {
        text,
        questionId,
        authorId: guest.id
      },
      include: { author: true }
    });

    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post answer' });
  }
});


// 6. AI System - Gemini Integration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/ai/analyze-comparison', async (req, res) => {
  try {
    const { colleges } = req.body;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'AI key not configured' });

    const collegeDataStr = colleges.map((c: any) => 
      `${c.name}: Rating ${c.rating}, Fees ${c.fees}, Programs ${c.details?.programs}, Cutoff ${c.cutoffs?.[0]?.maxRank}`
    ).join(' | ');

    const prompt = `You are a professional college counselor. Analyze these colleges for a student: ${collegeDataStr}. 
    Highlight the pros and cons of each and recommend the best one based on different student priorities (budget, reputation, academics). Keep it concise and professional.`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ analysis: aiResponse });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: 'AI Analysis failed' });
  }
});

app.post('/api/ai/predictor', async (req, res) => {
  try {
    const { rank, exam, category, collegeName, location, cutoffs } = req.body;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'AI key not configured' });

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

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    // Clean JSON if needed
    aiResponse = aiResponse.replace(/```json|```/g, '').trim();
    
    res.json(JSON.parse(aiResponse));
  } catch (error) {
    console.error('AI Prediction Error:', error);
    res.status(500).json({ error: 'AI Prediction failed' });
  }
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
