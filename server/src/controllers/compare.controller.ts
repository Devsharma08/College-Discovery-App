import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getCached, setCached } from '../utils/cache';

export const compareColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collegeIds } = req.body;
    if (!collegeIds || !Array.isArray(collegeIds)) {
      res.status(400).json({ error: 'collegeIds must be an array' });
      return;
    }
    
    const ids = collegeIds.filter((id): id is string => typeof id === 'string').slice(0, 3);
    const cacheKey = `compare:${ids.sort().join(',')}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      res.json(cached);
      return;
    }

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
};
