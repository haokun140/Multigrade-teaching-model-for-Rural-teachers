import express from 'express';
import { schoolController } from '../controllers/schoolController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authMiddleware, schoolController.createSchool);
router.post('/join', authMiddleware, schoolController.joinSchool);
router.get('/', authMiddleware, schoolController.getSchool);
router.get('/subjects', authMiddleware, schoolController.getSubjects);
router.get('/time-configs', authMiddleware, schoolController.getTimeConfigs);
router.put('/time-configs', authMiddleware, schoolController.updateTimeConfigs);
router.get('/curriculum-configs', authMiddleware, schoolController.getCurriculumConfigs);
router.post('/curriculum-configs', authMiddleware, schoolController.createCurriculumConfig);
router.put('/curriculum-configs/:id', authMiddleware, schoolController.updateCurriculumConfig);
router.delete('/curriculum-configs/:id', authMiddleware, schoolController.deleteCurriculumConfig);
export default router;
