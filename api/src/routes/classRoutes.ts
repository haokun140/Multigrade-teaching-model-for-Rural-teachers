import express from 'express';
import { classController } from '../controllers/classController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, classController.getClasses);
router.post('/', authMiddleware, classController.createClass);
router.put('/:id', authMiddleware, classController.updateClass);
router.delete('/:id', authMiddleware, classController.deleteClass);

export default router;
