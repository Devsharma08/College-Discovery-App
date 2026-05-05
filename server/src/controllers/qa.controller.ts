import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ApiError, asyncHandler } from '../utils/errors';
import { paramToString } from '../utils/helpers';

export const getQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    const questions = await prisma.question.findMany({
      where: { collegeId: id },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        answers: { include: { author: { select: { username: true, avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
});

export const postQuestion = asyncHandler(async (req: Request | any, res: Response): Promise<void> => {
    const id = paramToString(req.params.id);
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Must be logged in to post a question', 'UNAUTHORIZED');
    }

    if (!text || String(text).trim().length < 3) {
      throw new ApiError(400, 'Question must be at least 3 characters', 'INVALID_QUESTION');
    }

    if (String(text).length > 600) {
      throw new ApiError(400, 'Question is too long (max 600 characters)', 'QUESTION_TOO_LONG');
    }

    const question = await prisma.question.create({
      data: {
        text: String(text).trim(),
        collegeId: id,
        authorId: userId
      },
      include: { 
        author: { select: { username: true, avatarUrl: true } },
        answers: { include: { author: { select: { username: true, avatarUrl: true } } } }
      }
    });

    res.set('Cache-Control', 'private, no-store');
    res.status(201).json(question);
});

export const postAnswer = asyncHandler(async (req: Request | any, res: Response): Promise<void> => {
    const questionId = paramToString(req.params.questionId, 'questionId');
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Must be logged in to post an answer', 'UNAUTHORIZED');
    }

    if (!text || String(text).trim().length < 2) {
      throw new ApiError(400, 'Answer must be at least 2 characters', 'INVALID_ANSWER');
    }

    if (String(text).length > 1000) {
      throw new ApiError(400, 'Answer is too long (max 1000 characters)', 'ANSWER_TOO_LONG');
    }

    const answer = await prisma.answer.create({
      data: {
        text: String(text).trim(),
        questionId,
        authorId: userId
      },
      include: { author: { select: { username: true, avatarUrl: true } } }
    });

    res.set('Cache-Control', 'private, no-store');
    res.status(201).json(answer);
});
