"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSearchRequest = exports.validateRequest = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            if (req.body && Object.keys(req.body).length > 0) {
                req.body = await schema.parseAsync(req.body);
            }
            if (req.query && Object.keys(req.query).length > 0) {
                req.query = await schema.parseAsync(req.query);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                logger_1.logger.warn('Validation error', {
                    errors: error.errors,
                    path: req.path,
                    method: req.method
                });
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    })),
                    statusCode: 400
                });
            }
            logger_1.logger.error('Unexpected validation error', { error, path: req.path });
            return next(error);
        }
    };
};
exports.validateRequest = validateRequest;
const validateSearchRequest = (req, res, next) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_QUERY',
            message: 'Search query is required and must be a non-empty string',
            statusCode: 400
        });
    }
    if (query.length > 500) {
        return res.status(400).json({
            success: false,
            error: 'QUERY_TOO_LONG',
            message: 'Search query must be less than 500 characters',
            statusCode: 400
        });
    }
    return next();
};
exports.validateSearchRequest = validateSearchRequest;
//# sourceMappingURL=validation.js.map