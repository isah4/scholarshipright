import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { StructuredSearchRequestSchema } from '../types/validation';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = await schema.parseAsync(req.body);
      }
      
      // Validate query parameters
      if (req.query && Object.keys(req.query).length > 0) {
        req.query = await schema.parseAsync(req.query);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', { 
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
      
      logger.error('Unexpected validation error', { error, path: req.path });
      return next(error);
    }
  };
};

export const validateSearchRequest = (req: Request, res: Response, next: NextFunction) => {
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

export const validateStructuredSearchRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedRequest = StructuredSearchRequestSchema.parse(req.body);
    req.body = validatedRequest;
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Structured search validation error', { 
        errors: error.errors,
        path: req.path,
        method: req.method,
        body: req.body
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
    
    logger.error('Unexpected structured search validation error', { error, path: req.path });
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      statusCode: 400
    });
  }
};
