import express from 'express';
import { timetableController } from '../controllers/timetableController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:classId', authMiddleware, timetableController.getTimetable);
router.post('/', authMiddleware, timetableController.setTimetableEntry);
router.put('/weekly/:classId', authMiddleware, timetableController.updateWeeklyTimetable);
router.delete('/:id', authMiddleware, timetableController.deleteTimetableEntry);

export default router;
