import express from 'express';
import { horizontalPlanController } from '../controllers/horizontalPlanController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/timetable/:timetableId', authMiddleware, horizontalPlanController.getHorizontalPlan);
router.get('/:id', authMiddleware, horizontalPlanController.getHorizontalPlanById);
router.post('/', authMiddleware, horizontalPlanController.createHorizontalPlan);
router.put('/:id', authMiddleware, horizontalPlanController.updateHorizontalPlan);
router.delete('/:id', authMiddleware, horizontalPlanController.deleteHorizontalPlan);

export default router;
