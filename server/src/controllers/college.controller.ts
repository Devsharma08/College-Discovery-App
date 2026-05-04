import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getCached, setCached } from '../utils/cache';
import { toPositiveInt } from '../utils/helpers';

export const getColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, state, city, maxFees, course, facility, sort } = req.query;
    const take = toPositiveInt(req.query.limit, 60);
    const skip = toPositiveInt(req.query.offset, 0, 10_000);
    const cacheKey = `colleges:light:${search ?? ''}:${state ?? ''}:${city ?? ''}:${maxFees ?? ''}:${course ?? ''}:${facility ?? ''}:${sort ?? ''}:${take}:${skip}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      res.json(cached);
      return;
    }

    let orderBy: any = [{ rating: 'desc' }, { id: 'asc' }];
    if (sort === 'fees_asc') orderBy = [{ fees: 'asc' }, { id: 'asc' }];
    else if (sort === 'fees_desc') orderBy = [{ fees: 'desc' }, { id: 'asc' }];
    else if (sort === 'rating_asc') orderBy = [{ rating: 'asc' }, { id: 'asc' }];
    
    const colleges = await prisma.college.findMany({
      where: {
        AND: [
          search ? { name: { contains: String(search), mode: 'insensitive' } } : {},
          state ? { state: String(state) } : {},
          city ? { city: String(city) } : {},
          maxFees ? { fees: { lte: Number(maxFees) } } : {},
          course ? { courses: { some: { name: { contains: String(course), mode: 'insensitive' } } } } : {},
          facility ? { facilities: { some: { facility: { name: { contains: String(facility), mode: 'insensitive' } } } } } : {},
        ]
      },
      take,
      skip,
      orderBy,
      select: {
        id: true,
        name: true,
        location: true,
        state: true,
        city: true,
        rating: true,
        fees: true,
        imgUrl: true,
        popularFor: true
        // Details/Cutoffs excluded to keep packet light!
      }
    });

    setCached(cacheKey, colleges);
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
};

export const getFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const cached = getCached('college:meta:filters');
    if (cached) {
      res.json(cached);
      return;
    }

    const colleges = await prisma.college.findMany({
      select: { state: true }
    });

    const states = [...new Set(colleges.map(c => c.state).filter(Boolean))].sort();

    const facilitiesObj = await prisma.facility.findMany({
      select: { name: true }
    });
    
    const facilities = [...new Set(facilitiesObj.map(f => f.name).filter(Boolean))].sort();

    const data = { states, facilities };
    setCached('college:meta:filters', data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
};

export const getCollegeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `college:details:${id}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      res.json(cached);
      return;
    }

    const college = await prisma.college.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        rating: true,
        fees: true,
        imgUrl: true,
        popularFor: true,
        details: {
          select: {
            description: true,
            imageUrl: true,
            programs: true
          }
        },
        cutoffs: {
          select: {
            examName: true,
            maxRank: true,
            category: true
          }
        }
      }
    });

    if (!college) {
      res.status(404).json({ error: 'College not found' });
      return;
    }
    
    setCached(cacheKey, college);
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch college details' });
  }
};

// --- NEW EXTENDED APIs FOR LIGHT PACKETS ---

export const getCollegeCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const courses = await prisma.course.findMany({
      where: { collegeId: id },
      select: { id: true, name: true, level: true, durationInYears: true, tuitionFee: true, seatsAvailable: true }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getCollegePlacements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const placements = await prisma.placementStat.findMany({
      where: { collegeId: id },
      orderBy: { year: 'desc' },
      select: { id: true, year: true, highestPackage: true, averagePackage: true, placementPercentage: true, topRecruiters: true }
    });
    res.json(placements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch placements' });
  }
};

export const getCollegeFacilities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const facilities = await prisma.collegeFacility.findMany({
      where: { collegeId: id },
      include: { facility: { select: { name: true, iconUrl: true } } }
    });
    res.json(facilities.map(f => f.facility));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
};

export const getCollegeEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const events = await prisma.event.findMany({
      where: { collegeId: id, date: { gte: new Date() } }, // only upcoming events
      orderBy: { date: 'asc' },
      select: { id: true, title: true, description: true, date: true, type: true }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getCollegeReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { collegeId: id },
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, rating: true, comment: true, createdAt: true,
        user: { select: { username: true, avatarUrl: true } }
      }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const postCollegeReview = async (req: Request | any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.userId; // Assumes auth middleware

    if (!userId) {
      res.status(401).json({ error: 'You must be logged in to leave a review' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        collegeId: id,
        userId,
        rating,
        comment
      },
      include: {
        user: { select: { username: true, avatarUrl: true } }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post review' });
  }
};
