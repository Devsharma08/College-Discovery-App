import { Router } from 'express';
import { predictColleges } from '../controllers/predictor.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, predictColleges);

export default router;
