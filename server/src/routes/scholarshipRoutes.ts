import { Router } from 'express';
import { ScholarshipController } from '../controllers/scholarshipController';
import { validateSearchRequest } from '../middleware/validation';

const router = Router();
const scholarshipController = new ScholarshipController();

// Health check endpoint
router.get('/health', scholarshipController.healthCheck);

// Search scholarships endpoint
router.post('/search', validateSearchRequest, scholarshipController.searchScholarships);

// Get mock scholarships for testing (when external services are unavailable)
router.get('/mock', scholarshipController.getMockScholarships);

// Validate search query
router.get('/validate', scholarshipController.validateQuery);

export default router;
