import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getUploadUrl,
  createDocument,
  getDocuments,
  getDocument,
  getDownloadUrl,
  deleteDocument,
  updateAiResults
} from '../controllers/documentController.js';

const router = express.Router();

// Apply JWT authentication protection to all routes below
router.use(protect);

router.get('/upload-url', getUploadUrl);
router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.get('/:id/download-url', getDownloadUrl);
router.delete('/:id', deleteDocument);
router.put('/:id/ai-results', updateAiResults);

export default router;
