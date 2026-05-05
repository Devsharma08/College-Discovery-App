import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getCached, setCached } from '../utils/cache';
import { ApiError, asyncHandler } from '../utils/errors';

export const compareColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { collegeIds } = req.body;
    if (!collegeIds || !Array.isArray(collegeIds)) {
      throw new ApiError(400, 'collegeIds must be an array', 'INVALID_COLLEGE_IDS');
    }
    
    const ids = [...new Set(collegeIds.filter((id): id is string => typeof id === 'string'))].slice(0, 3);
    if (ids.length === 0) {
      throw new ApiError(400, 'At least one college id is required', 'INVALID_COLLEGE_IDS');
    }

    const cacheKey = `compare:${ids.sort().join(',')}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
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
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json(colleges);
});
