import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { paramToString } from '../utils/helpers';

export const createCollege = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const {
      name, location, state, city, rating, fees, popularFor, imgUrl,
      details, // object with description, imageUrl, programs
      courses, // array of courses
      cutoffs // array of cutoffs
    } = req.body;

    const newCollege = await prisma.college.create({
      data: {
        name, location, state, city, rating, fees, popularFor, imgUrl,
        details: details ? {
          create: details
        } : undefined,
        courses: courses && courses.length > 0 ? {
          create: courses
        } : undefined,
        cutoffs: cutoffs && cutoffs.length > 0 ? {
          create: cutoffs
        } : undefined
      }
    });

    res.status(201).json(newCollege);
  } catch (error) {
    console.error('Admin Create College Error:', error);
    res.status(500).json({ error: 'Failed to create college' });
  }
};

export const deleteCollege = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const id = paramToString(req.params.id);
    await prisma.college.delete({ where: { id } });

    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete college' });
  }
};
