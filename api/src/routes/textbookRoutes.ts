import express from 'express';
import { textbookController } from '../controllers/textbookController.js';

const router = express.Router();

router.get('/versions', textbookController.getVersions);
router.get('/grades', textbookController.getGrades);
router.get('/volumes', textbookController.getVolumes);

export default router;
