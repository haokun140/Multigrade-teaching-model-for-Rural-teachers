import express from 'express';
import { lessonPlanController } from '../controllers/lessonPlanController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, lessonPlanController.getLessonPlans);
router.get('/all', authMiddleware, lessonPlanController.getAllLessonPlans);
router.get('/:id', authMiddleware, lessonPlanController.getLessonPlan);
router.post('/', authMiddleware, lessonPlanController.createLessonPlan);
router.put('/:id', authMiddleware, lessonPlanController.updateLessonPlan);
router.delete('/:id', authMiddleware, lessonPlanController.deleteLessonPlan);
router.post('/:id/copy', authMiddleware, lessonPlanController.copyLessonPlan);

export default router;
