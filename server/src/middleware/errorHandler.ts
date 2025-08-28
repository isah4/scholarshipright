import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log the error
  logger.error('Unhandled error', {
    error: message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    statusCode
  });
  
  // Don't leak error details in production
  const errorResponse = {
    success: false,
    error: error.name || 'INTERNAL_ERROR',
    message: isDevelopment ? message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
    statusCode
  };
  
  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.path} not found`,
    statusCode: 404
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Import config for development check
import { isDevelopment } from '../utils/config';
