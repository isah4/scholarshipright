"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipController = void 0;
const scholarshipService_1 = require("../services/scholarshipService");
const validation_1 = require("../types/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const structured_1 = require("../types/structured");
const uuid_1 = require("uuid");
class ScholarshipController {
    constructor() {
        this.searchScholarships = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const startTime = Date.now();
            try {
                const validatedRequest = validation_1.SearchRequestSchema.parse(req.body);
                logger_1.logger.info('Search request received', {
                    query: validatedRequest.query,
                    limit: validatedRequest.limit,
                    ip: req.ip
                });
                const result = await this.scholarshipService.searchScholarships(validatedRequest);
                const responseTime = Date.now() - startTime;
                logger_1.logger.info('Search request completed', {
                    query: validatedRequest.query,
                    responseTime,
                    resultsCount: result.data.length
                });
                res.status(200).json(result);
            }
            catch (error) {
                const responseTime = Date.now() - startTime;
                logger_1.logger.error('Search request failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    responseTime,
                    body: req.body
                });
                if (error instanceof Error) {
                    res.status(500).json({
                        success: false,
                        error: 'SEARCH_FAILED',
                        message: error.message,
                        statusCode: 500
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: 'UNKNOWN_ERROR',
                        message: 'An unexpected error occurred',
                        statusCode: 500
                    });
                }
            }
        });
        this.structuredSearch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { query, locale, depth } = req.body || {};
            const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
            req.correlationId = correlationId;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ success: false, error: 'MISSING_QUERY', message: 'Body.query is required', statusCode: 400 });
            }
            if (process.env.STRUCTURED_SEARCH_ENABLED !== 'true') {
                return res.status(403).json({ success: false, error: 'FEATURE_DISABLED', message: 'Structured search is disabled', statusCode: 403 });
            }
            const started = Date.now();
            try {
                logger_1.logger.info('Structured search started', { query, depth, correlationId });
                const result = await this.scholarshipService.structuredSearch(query, locale, depth);
                const parsed = structured_1.StructuredResponseSchema.parse(result);
                logger_1.logger.info('Structured search completed', { query, items: parsed.items.length, ms: Date.now() - started, correlationId });
                return res.status(200).json({ success: true, data: parsed, correlationId });
            }
            catch (error) {
                logger_1.logger.error('Structured search failed', { error, query, correlationId });
                return res.status(500).json({ success: false, error: 'STRUCTURED_SEARCH_FAILED', message: error instanceof Error ? error.message : 'Unknown error', statusCode: 500, correlationId });
            }
        });
        this.getMockScholarships = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_QUERY',
                    message: 'Query parameter is required',
                    statusCode: 400
                });
            }
            try {
                const result = await this.scholarshipService.getMockScholarships(query);
                return res.status(200).json(result);
            }
            catch (error) {
                logger_1.logger.error('Mock scholarship request failed', { error, query });
                return res.status(500).json({
                    success: false,
                    error: 'MOCK_GENERATION_FAILED',
                    message: 'Failed to generate mock scholarships',
                    statusCode: 500
                });
            }
        });
        this.validateQuery = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_QUERY',
                    message: 'Query parameter is required',
                    statusCode: 400
                });
            }
            try {
                const isValid = await this.scholarshipService.validateQuery(query);
                return res.status(200).json({
                    success: true,
                    data: { isValid, query },
                    message: isValid ? 'Query is valid' : 'Query is invalid'
                });
            }
            catch (error) {
                logger_1.logger.error('Query validation failed', { error, query });
                return res.status(500).json({
                    success: false,
                    error: 'VALIDATION_FAILED',
                    message: 'Failed to validate query',
                    statusCode: 500
                });
            }
        });
        this.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            try {
                const health = await this.scholarshipService.getServiceHealth();
                const statusCode = health.overall ? 200 : 503;
                res.status(statusCode).json({
                    success: health.overall,
                    data: {
                        timestamp: new Date().toISOString(),
                        services: {
                            search: health.searchService,
                            ai: health.aiService
                        },
                        overall: health.overall
                    },
                    message: health.overall ? 'All services are healthy' : 'Some services are unhealthy'
                });
            }
            catch (error) {
                logger_1.logger.error('Health check failed', { error });
                res.status(503).json({
                    success: false,
                    error: 'HEALTH_CHECK_FAILED',
                    message: 'Health check failed',
                    statusCode: 503
                });
            }
        });
        this.scholarshipService = new scholarshipService_1.ScholarshipService();
    }
}
exports.ScholarshipController = ScholarshipController;
//# sourceMappingURL=scholarshipController.js.map