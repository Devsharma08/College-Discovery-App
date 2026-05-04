import { Router } from 'express';
import { compareColleges } from '../controllers/compare.controller';

const router = Router();

router.post('/', compareColleges);

export default router;
