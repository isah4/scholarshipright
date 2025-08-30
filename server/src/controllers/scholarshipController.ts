import { Request, Response } from 'express';
import { ScholarshipService } from '../services/scholarshipService';
import { SearchRequestSchema } from '../types/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { StructuredResponseSchema, StructuredResponse } from '../types/structured';
import { v4 as uuidv4 } from 'uuid';

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
      
      // Check if structured search is enabled - if so, redirect to structured search
      if (process.env.STRUCTURED_SEARCH_ENABLED === 'true') {
        logger.info('🔄 Standard search redirected to structured search (STRUCTURED_SEARCH_ENABLED=true)', { 
          query: validatedRequest.query,
          originalEndpoint: '/api/scholarships/search',
          redirectedTo: 'structuredSearch'
        });
        
        // Call structured search instead
        const result: StructuredResponse = await this.scholarshipService.structuredSearch(
          validatedRequest.query, 
          undefined, // locale
          'standard' // depth
        );
        
        const responseTime = Date.now() - startTime;
        
        logger.info('🔄 Redirected search completed successfully', { 
          query: validatedRequest.query,
          responseTime,
          resultsCount: result.items?.length || 0,
          searchType: 'structured (redirected)'
        });
        
        // Return structured search response in standard search format for compatibility
        return res.status(200).json({
          success: true,
          data: result.items || [],
          message: `Structured search results for "${validatedRequest.query}" (${result.items?.length || 0} scholarships found)`,
          processing_time: responseTime,
          total_results: result.items?.length || 0,
          _redirected: true,
          _searchType: 'structured'
        });
      }
      
      // If structured search is disabled, proceed with standard search
      logger.info('🔍 Proceeding with standard search (STRUCTURED_SEARCH_ENABLED=false)', { 
        query: validatedRequest.query 
      });
      
      // Process the standard search
      const result = await this.scholarshipService.searchScholarships(validatedRequest);
      
      const responseTime = Date.now() - startTime;
      
      logger.info('Search request completed', { 
        query: validatedRequest.query,
        responseTime,
        resultsCount: result.data.length,
        searchType: 'standard'
      });
      
      return res.status(200).json(result);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Search request failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        body: req.body 
      });
      
      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          error: 'SEARCH_FAILED',
          message: error.message,
          statusCode: 500
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          statusCode: 500
        });
      }
    }
  });

  // Structured search endpoint
  structuredSearch = asyncHandler(async (req: Request, res: Response) => {
    const { query, locale, depth } = req.body || {};
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    (req as any).correlationId = correlationId;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'MISSING_QUERY', message: 'Body.query is required', statusCode: 400 });
    }
    if (process.env.STRUCTURED_SEARCH_ENABLED !== 'true') {
      return res.status(403).json({ success: false, error: 'FEATURE_DISABLED', message: 'Structured search is disabled', statusCode: 403 });
    }
    const started = Date.now();
    try {
      logger.info('Structured search started', { query, depth, correlationId });
      const result = await this.scholarshipService.structuredSearch(query, locale, depth);
      // validate shape for safety
      const parsed = StructuredResponseSchema.parse(result);
      logger.info('Structured search completed', { query, items: parsed.items.length, ms: Date.now() - started, correlationId });
      return res.status(200).json({ success: true, data: parsed, correlationId });
    } catch (error) {
      logger.error('Structured search failed', { error, query, correlationId });
      return res.status(500).json({ success: false, error: 'STRUCTURED_SEARCH_FAILED', message: error instanceof Error ? error.message : 'Unknown error', statusCode: 500, correlationId });
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
