import { Router } from 'express';
import { createCollege, deleteCollege } from '../controllers/admin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/colleges', createCollege);
router.delete('/colleges/:id', deleteCollege);

export default router;
