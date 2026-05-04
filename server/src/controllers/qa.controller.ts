import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
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
};

export const postQuestion = async (req: Request | any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Must be logged in to post a question' });
      return;
    }

    const question = await prisma.question.create({
      data: {
        text,
        collegeId: id,
        authorId: userId
      }
    });

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post question' });
  }
};

export const postAnswer = async (req: Request | any, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Must be logged in to post an answer' });
      return;
    }

    const answer = await prisma.answer.create({
      data: {
        text,
        questionId,
        authorId: userId
      },
      include: { author: { select: { username: true, avatarUrl: true } } }
    });

    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post answer' });
  }
};
