import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getCached, setCached } from '../utils/cache';
import { toPositiveInt, getBestCutoffForRank, getPredictionPercent, getMatchReason } from '../utils/helpers';

export const predictColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rank, exam, category = 'General' } = req.query;
    if (!rank || !exam) {
      res.status(400).json({ error: 'Rank and exam are required' });
      return;
    }
    
    const parsedRank = toPositiveInt(rank, 0, 1_000_000);
    if (parsedRank <= 0) {
      res.status(400).json({ error: 'Rank must be a positive number' });
      return;
    }

    const cacheKey = `predictor:v2:${exam}:${parsedRank}:${category}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

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
};
