import express from 'express';
import { progressController } from '../controllers/progressController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, progressController.getProgress);

export default router;
