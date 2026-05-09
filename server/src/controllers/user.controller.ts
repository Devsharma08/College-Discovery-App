import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { paramToString } from '../utils/helpers';

// ==========================================
// WISHLIST / FAVORITES
// ==========================================

export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const favorites = await prisma.userCollegePreferences.findMany({
      where: { userId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            rating: true,
            fees: true,
            imgUrl: true
          }
        }
      }
    });

    res.json(favorites.map(f => f.college));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};


export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { collegeId } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!collegeId) {
      res.status(400).json({ error: 'collegeId is required' });
      return;
    }

    const existing = await prisma.userCollegePreferences.findFirst({
      where: { userId, collegeId }
    });

    if (existing) {
      await prisma.userCollegePreferences.delete({ where: { id: existing.id } });
      res.json({ message: 'Removed from favorites', isFavorited: false });
    } else {
      await prisma.userCollegePreferences.create({
        data: { userId, collegeId }
      });
      res.json({ message: 'Added to favorites', isFavorited: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

// ==========================================
// ACADEMIC RECORDS
// ==========================================

export const getAcademicRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const records = await prisma.userAcademicRecord.findMany({
      where: { userId }
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch academic records' });
  }
};

export const addAcademicRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { examName, score, rank, category } = req.body;
    if (!examName) {
      res.status(400).json({ error: 'examName is required' });
      return;
    }

    const record = await prisma.userAcademicRecord.create({
      data: {
        userId,
        examName,
        score: score ? Number(score) : null,
        rank: rank ? Number(rank) : null,
        category
      }
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add academic record' });
  }
};

export const deleteAcademicRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const id = paramToString(req.params.id);
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.userAcademicRecord.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Record not found or unauthorized' });
      return;
    }

    await prisma.userAcademicRecord.delete({ where: { id } });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete academic record' });
  }
};
