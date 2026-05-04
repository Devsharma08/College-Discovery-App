import { Router } from 'express';
import { predictColleges } from '../controllers/predictor.controller';

const router = Router();

router.get('/', predictColleges);

export default router;
