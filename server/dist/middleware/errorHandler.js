"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    logger_1.logger.error('Unhandled error', {
        error: message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        statusCode
    });
    const errorResponse = {
        success: false,
        error: error.name || 'INTERNAL_ERROR',
        message: config_1.isDevelopment ? message : 'Something went wrong',
        ...(config_1.isDevelopment && { stack: error.stack }),
        statusCode
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    logger_1.logger.warn('Route not found', { path: req.path, method: req.method });
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route ${req.path} not found`,
        statusCode: 404
    });
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const config_1 = require("../utils/config");
//# sourceMappingURL=errorHandler.js.map