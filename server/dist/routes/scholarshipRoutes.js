"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scholarshipController_1 = require("../controllers/scholarshipController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const scholarshipController = new scholarshipController_1.ScholarshipController();
router.get('/health', scholarshipController.healthCheck);
router.post('/search', validation_1.validateSearchRequest, scholarshipController.searchScholarships);
router.post('/search/structured', validation_1.validateStructuredSearchRequest, scholarshipController.structuredSearch);
router.get('/mock', scholarshipController.getMockScholarships);
router.get('/validate', scholarshipController.validateQuery);
exports.default = router;
//# sourceMappingURL=scholarshipRoutes.js.map