import { Request, Response } from 'express';
import { ScholarshipService } from '../services/scholarshipService';
import { SearchRequestSchema } from '../types/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ScholarshipController {
  private scholarshipService: ScholarshipService;

  constructor() {
    this.scholarshipService = new ScholarshipService();
  }

  // Search scholarships endpoint
  searchScholarships = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // Validate request body
      const validatedRequest = SearchRequestSchema.parse(req.body);
      
      logger.info('Search request received', { 
        query: validatedRequest.query,
        limit: validatedRequest.limit,
        ip: req.ip 
      });
      
      // Process the search
      const result = await this.scholarshipService.searchScholarships(validatedRequest);
      
      const responseTime = Date.now() - startTime;
      
      logger.info('Search request completed', { 
        query: validatedRequest.query,
        responseTime,
        resultsCount: result.data.length 
      });
      
      res.status(200).json(result);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Search request failed', { 
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
      } else {
        res.status(500).json({
          success: false,
          error: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          statusCode: 500
        });
      }
    }
  });

  // Get mock scholarships for testing
  getMockScholarships = asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      logger.error('Mock scholarship request failed', { error, query });
      return res.status(500).json({
        success: false,
        error: 'MOCK_GENERATION_FAILED',
        message: 'Failed to generate mock scholarships',
        statusCode: 500
      });
    }
  });

  // Validate search query
  validateQuery = asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      logger.error('Query validation failed', { error, query });
      return res.status(500).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Failed to validate query',
        statusCode: 500
      });
    }
  });

  // Health check endpoint
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
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
      
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        success: false,
        error: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        statusCode: 503
      });
    }
  });
}
