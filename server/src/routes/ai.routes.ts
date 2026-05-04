import { Router } from 'express';
import { analyzeComparison, aiPredictor, analyzeComparisonStream } from '../controllers/ai.controller';

const router = Router();

router.post('/analyze-comparison', analyzeComparison);
router.post('/stream-comparison', analyzeComparisonStream);
router.post('/predictor', aiPredictor);

export default router;
