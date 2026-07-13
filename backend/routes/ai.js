import express from 'express';
import { askTutor, askRAG, generateEmbeddings, getDKTPrediction } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Define routes and attach auth protection
router.post('/ask', protect, askTutor);
router.post('/rag-ask', protect, askRAG);
router.post('/embed', protect, generateEmbeddings);
router.post('/dkt-predict', protect, getDKTPrediction);

export default router;
