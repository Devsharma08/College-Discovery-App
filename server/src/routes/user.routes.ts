import { Router } from 'express';
import { 
  getFavorites, toggleFavorite, 
  getAcademicRecords, addAcademicRecord, deleteAcademicRecord 
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All user routes must be protected
router.use(protect);

router.get('/favorites', getFavorites);
router.post('/favorites', toggleFavorite);

router.get('/academic-records', getAcademicRecords);
router.post('/academic-records', addAcademicRecord);
router.delete('/academic-records/:id', deleteAcademicRecord);

export default router;
