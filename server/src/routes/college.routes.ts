import { Router } from 'express';
import { 
  getColleges, getCollegeById, getFilters,
  getCollegeCourses, getCollegePlacements, 
  getCollegeFacilities, getCollegeEvents, 
  getCollegeReviews, postCollegeReview 
} from '../controllers/college.controller';
import { getQuestions, postQuestion } from '../controllers/qa.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getColleges);
router.get('/meta/filters', getFilters);
router.get('/:id', getCollegeById);

// Detailed Sub-resources
router.get('/:id/courses', getCollegeCourses);
router.get('/:id/placements', getCollegePlacements);
router.get('/:id/facilities', getCollegeFacilities);
router.get('/:id/events', getCollegeEvents);
router.get('/:id/reviews', getCollegeReviews);
router.post('/:id/reviews', protect, postCollegeReview);

// Q&A nested routes
router.get('/:id/questions', getQuestions);
router.post('/:id/questions', protect, postQuestion);

export default router;
