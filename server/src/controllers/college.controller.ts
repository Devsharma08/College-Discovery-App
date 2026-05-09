import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { deleteCachedByPrefix, getCached, setCached } from '../utils/cache';
import { paramToString, toPositiveInt } from '../utils/helpers';
import { ApiError, asyncHandler, retryWithBackoff } from '../utils/errors';
import { beginNdjsonStream, streamSection, writeNdjson } from '../utils/stream';

const setPublicCache = (res: Response, seconds = 60) => {
  res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
};

const setPrivateNoStore = (res: Response) => {
  res.set('Cache-Control', 'private, no-store');
};

export const getColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, state, city, maxFees, course, facility, type, sort } = req.query;
    const take = toPositiveInt(req.query.limit, 30, 60);
    const skip = toPositiveInt(req.query.offset, 0, 10_000);
    const cacheKey = `colleges:light:${search ?? ''}:${state ?? ''}:${city ?? ''}:${maxFees ?? ''}:${course ?? ''}:${facility ?? ''}:${type ?? ''}:${sort ?? ''}:${take}:${skip}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      setPublicCache(res);
      res.json(cached);
      return;
    }

    let orderBy: any = [{ rating: 'desc' }, { id: 'asc' }];
    if (sort === 'fees_asc') orderBy = [{ fees: 'asc' }, { id: 'asc' }];
    else if (sort === 'fees_desc') orderBy = [{ fees: 'desc' }, { id: 'asc' }];
    else if (sort === 'rating_asc') orderBy = [{ rating: 'asc' }, { id: 'asc' }];
    
    const colleges = await retryWithBackoff(() => prisma.college.findMany({
      where: {
        AND: [
          search ? { name: { contains: String(search), mode: 'insensitive' } } : {},
          state ? { state: String(state) } : {},
          city ? { city: String(city) } : {},
          maxFees ? { fees: { lte: Number(maxFees) } } : {},
          course ? { courses: { some: { name: { contains: String(course), mode: 'insensitive' } } } } : {},
          facility ? { facilities: { some: { facility: { name: { contains: String(facility), mode: 'insensitive' } } } } } : {},
          type ? { type: String(type) } : {},
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
        popularFor: true,
        type: true,
        placementStats: {
          orderBy: { year: 'desc' },
          take: 1,
          select: { highestPackage: true, averagePackage: true, placementPercentage: true }
        },
        cutoffs: {
          take: 3,
          orderBy: { maxRank: 'asc' },
          select: { examName: true, maxRank: true }
        }
      }
    }));

    setCached(cacheKey, colleges);
    setPublicCache(res);
    res.json(colleges);
});

export const getFilters = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const cached = getCached('college:meta:filters');
    if (cached) {
      setPublicCache(res, 300);
      res.json(cached);
      return;
    }

    const [collegeRows, facilitiesObj, courseRows] = await retryWithBackoff(() => Promise.all([
      prisma.college.findMany({ select: { state: true, city: true, type: true } }),
      prisma.facility.findMany({ select: { name: true } }),
      prisma.course.findMany({ select: { name: true }, distinct: ['name'] }),
    ]));

    const states = [...new Set(collegeRows.map(c => c.state).filter(Boolean))].sort() as string[];
    const cities = [...new Set(collegeRows.map(c => c.city).filter(Boolean))].sort() as string[];
    const facilities = [...new Set(facilitiesObj.map(f => f.name).filter(Boolean))].sort();
    const courses = [...new Set(courseRows.map(c => c.name).filter(Boolean))].sort();
    const types = [...new Set(collegeRows.map(c => c.type).filter(Boolean))].sort() as string[];

    const data = { states, cities, facilities, courses, types };
    setCached('college:meta:filters', data);
    setPublicCache(res, 300);
    res.json(data);
});

export const getCollegeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const cacheKey = `college:details:${id}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      setPublicCache(res);
      res.json(cached);
      return;
    }

    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        details: true,
        cutoffs: { orderBy: { maxRank: 'asc' } },
        courses: { orderBy: { name: 'asc' } },
        placementStats: { orderBy: { year: 'desc' } },
        facilities: { include: { facility: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { username: true, avatarUrl: true } } }
        },
        events: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 5
        },
      }
    });

    if (!college) {
      throw new ApiError(404, 'College not found', 'COLLEGE_NOT_FOUND');
    }
    
    setCached(cacheKey, college);
    setPublicCache(res);
    res.json(college);
});

export const getCollegeLight = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const cacheKey = `college:light:${id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setPublicCache(res);
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
        city: true,
        state: true
      }
    });
    if (!college) {
      throw new ApiError(404, 'College not found', 'COLLEGE_NOT_FOUND');
    }
    setCached(cacheKey, college);
    setPublicCache(res);
    res.json(college);
});

// --- NEW EXTENDED APIs FOR LIGHT PACKETS ---

export const getCollegeCourses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const cacheKey = `college:courses:${id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setPublicCache(res);
      res.json(cached);
      return;
    }
    const courses = await prisma.course.findMany({
      where: { collegeId: id },
      select: { id: true, name: true, level: true, durationInYears: true, tuitionFee: true, seatsAvailable: true }
    });
    setCached(cacheKey, courses);
    setPublicCache(res);
    res.json(courses);
});

export const getCollegePlacements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const cacheKey = `college:placements:${id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setPublicCache(res);
      res.json(cached);
      return;
    }
    const placements = await prisma.placementStat.findMany({
      where: { collegeId: id },
      orderBy: { year: 'desc' },
      select: { id: true, year: true, highestPackage: true, averagePackage: true, placementPercentage: true, topRecruiters: true }
    });
    setCached(cacheKey, placements);
    setPublicCache(res);
    res.json(placements);
});

export const getCollegeFacilities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const cacheKey = `college:facilities:${id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setPublicCache(res);
      res.json(cached);
      return;
    }
    const facilities = await (prisma.collegeFacility.findMany as any)({
      where: { collegeId: id },
      include: { facility: { select: { name: true, iconUrl: true } } }
    });
    const payload = facilities.map((f: any) => f.facility);
    setCached(cacheKey, payload);
    setPublicCache(res);
    res.json(payload);
});

export const getCollegeEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const events = await prisma.event.findMany({
      where: { collegeId: id, date: { gte: new Date() } }, // only upcoming events
      orderBy: { date: 'asc' },
      select: { id: true, title: true, description: true, date: true, type: true }
    });
    setPublicCache(res);
    res.json(events);
});

export const getCollegeReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const reviews = await prisma.review.findMany({
      where: { collegeId: id },
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, rating: true, comment: true, createdAt: true,
        user: { select: { username: true, avatarUrl: true } }
      }
    });
    setPublicCache(res, 30);
    res.json(reviews);
});

export const postCollegeReview = asyncHandler(async (req: Request | any, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const { rating, comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'You must be logged in to leave a review', 'UNAUTHORIZED');
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5', 'INVALID_RATING');
    }

    if (comment && comment.length > 500) {
      throw new ApiError(400, 'Comment is too long (max 500 characters)', 'COMMENT_TOO_LONG');
    }

    // Check if user already reviewed this college
    const existingReview = await prisma.review.findUnique({
      where: { userId_collegeId: { userId, collegeId: id } }
    });

    if (existingReview) {
      throw new ApiError(409, 'You have already reviewed this college', 'REVIEW_EXISTS');
    }

    const review = await prisma.review.create({
      data: {
        collegeId: id,
        userId,
        rating: Number(rating),
        comment
      },
      include: {
        user: { select: { username: true, avatarUrl: true } }
      }
    });

    // Recalculate average rating for the college
    const allReviews = await prisma.review.findMany({
      where: { collegeId: id },
      select: { rating: true }
    });

    const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await prisma.college.update({
      where: { id },
      data: { rating: parseFloat(averageRating.toFixed(1)) }
    });

    deleteCachedByPrefix(`college:details:${id}`);
    deleteCachedByPrefix(`college:light:${id}`);
    setPrivateNoStore(res);
    res.status(201).json(review);
});

export const streamCollegeDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = paramToString(req.params.id);
  beginNdjsonStream(res);

  const core = await prisma.college.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      location: true,
      rating: true,
      fees: true,
      imgUrl: true,
      popularFor: true,
      city: true,
      state: true,
      details: { select: { description: true, programs: true } },
      cutoffs: { orderBy: { maxRank: 'asc' } },
    },
  });

  if (!core) {
    writeNdjson(res, { type: 'error', error: { message: 'College not found' } });
    res.end();
    return;
  }

  writeNdjson(res, { type: 'college', data: core });

  await Promise.all([
    streamSection(res, 'courses', () => prisma.course.findMany({
      where: { collegeId: id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, level: true, durationInYears: true, tuitionFee: true, seatsAvailable: true },
    })),
    streamSection(res, 'placements', () => prisma.placementStat.findMany({
      where: { collegeId: id },
      orderBy: { year: 'desc' },
      select: { id: true, year: true, highestPackage: true, averagePackage: true, placementPercentage: true, topRecruiters: true },
    })),
    streamSection(res, 'facilities', async () => {
      const facilities = await (prisma.collegeFacility.findMany as any)({
        where: { collegeId: id },
        include: { facility: { select: { name: true, iconUrl: true } } },
      });
      return facilities.map((f: any) => f.facility);
    }),
    streamSection(res, 'reviews', () => prisma.review.findMany({
      where: { collegeId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { username: true, avatarUrl: true } } },
    })),
    streamSection(res, 'events', () => prisma.event.findMany({
      where: { collegeId: id, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      select: { id: true, title: true, description: true, date: true, type: true },
    })),
    streamSection(res, 'questions', () => prisma.question.findMany({
      where: { collegeId: id },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        answers: { include: { author: { select: { username: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })),
  ]);

  writeNdjson(res, { type: 'done' });
  res.end();
});
