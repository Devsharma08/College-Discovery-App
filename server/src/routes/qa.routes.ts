import { Router } from 'express';
import { postAnswer } from '../controllers/qa.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// This mounts at /api/questions
router.post('/:questionId/answers', protect, postAnswer);

export default router;
