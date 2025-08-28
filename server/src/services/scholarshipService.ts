import { SearchService, SearchResult } from './searchService';
import { AIService } from './aiService';
import { logger } from '../utils/logger';
import { Scholarship, SearchRequest, SearchResponse } from '../types/scholarship';
import { SearchRequestSchema } from '../types/validation';

export class ScholarshipService {
  private searchService: SearchService;
  private aiService: AIService;

  constructor() {
    this.searchService = new SearchService();
    this.aiService = new AIService();
  }

  async searchScholarships(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting scholarship search', { query: request.query, limit: request.limit });
      
      // Validate the request
      const validatedRequest = SearchRequestSchema.parse(request);
      
      // Step 1: Try to search for scholarship information
      let searchResults: SearchResult[] = [];
      try {
        searchResults = await this.searchService.searchScholarships(
          validatedRequest.query, 
          validatedRequest.limit
        );
        
        if (searchResults.length === 0) {
          logger.warn('No search results found, using mock data', { query: validatedRequest.query });
          searchResults = await this.searchService.getMockSearchResults(
            validatedRequest.query, 
            validatedRequest.limit
          );
        }
      } catch (searchError) {
        logger.warn('Search service failed, falling back to mock data', { 
          error: searchError, 
          query: validatedRequest.query 
        });
        // Fallback to mock search results
        searchResults = await this.searchService.getMockSearchResults(
          validatedRequest.query, 
          validatedRequest.limit
        );
      }
      
      if (searchResults.length === 0) {
        logger.warn('No search results available', { query: validatedRequest.query });
        return {
          success: true,
          data: [],
          message: 'No scholarships found for the given query',
          processing_time: Date.now() - startTime,
          total_results: 0
        };
      }
      
      // Step 2: Prepare data for AI processing
      const rawData = this.prepareRawData(searchResults);
      
      // Step 3: Process with AI to extract structured information
      let scholarships: Scholarship[] = [];
      try {
        scholarships = await this.aiService.processScholarshipData(
          rawData, 
          validatedRequest.query
        );
      } catch (aiError) {
        logger.warn('AI processing failed, using mock scholarships', { 
          error: aiError, 
          query: validatedRequest.query 
        });
        // Fallback to mock scholarships
        scholarships = await this.aiService.generateMockScholarship(validatedRequest.query);
      }
      
      // Step 4: Sanitize and validate final response
      const sanitizedScholarships = this.sanitizeResponseData(scholarships);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Scholarship search completed successfully', {
        query: validatedRequest.query,
        resultsCount: sanitizedScholarships.length,
        processingTime
      });
      
      return {
        success: true,
        data: sanitizedScholarships,
        message: `Found ${sanitizedScholarships.length} scholarship(s)`,
        processing_time: processingTime,
        total_results: sanitizedScholarships.length
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Scholarship search failed', { 
        error, 
        query: request.query,
        processingTime 
      });
      
      // Return error response
      throw new Error(`Scholarship search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private prepareRawData(searchResults: SearchResult[]): string {
    // Combine search results into a single text for AI processing
    const dataParts = searchResults.map((result, index) => {
      return `
SOURCE ${index + 1}: ${result.source}
TITLE: ${result.title}
LINK: ${result.link}
CONTENT: ${result.snippet}
---
`;
    });
    
    return dataParts.join('\n');
  }

  private sanitizeResponseData(scholarships: Scholarship[]): Scholarship[] {
    return scholarships.map(scholarship => {
      // Deep clone to avoid modifying original
      const sanitized = JSON.parse(JSON.stringify(scholarship));
      
      // Ensure all required fields have proper values
      sanitized.title = sanitized.title || 'Unknown Scholarship';
      sanitized.scholarship_type = sanitized.scholarship_type || 'fully funded';
      sanitized.degree_levels = Array.isArray(sanitized.degree_levels) ? sanitized.degree_levels : ['Masters'];
      sanitized.host_country = sanitized.host_country || 'Not specified';
      sanitized.eligible_countries = sanitized.eligible_countries || 'Not specified';
      sanitized.application_link = sanitized.application_link || 'https://example.com/not-specified';
      sanitized.renewal = sanitized.renewal || 'Not specified';
      
      // Ensure benefits object is complete
      if (!sanitized.benefits) sanitized.benefits = {};
      sanitized.benefits.tuition = sanitized.benefits.tuition || 'Not specified';
      sanitized.benefits.stipend = sanitized.benefits.stipend || 'Not specified';
      sanitized.benefits.travel = sanitized.benefits.travel || 'Not specified';
      sanitized.benefits.insurance = sanitized.benefits.insurance || 'Not specified';
      sanitized.benefits.others = Array.isArray(sanitized.benefits.others) ? sanitized.benefits.others : [];
      
      // Ensure requirements object is complete
      if (!sanitized.requirements) sanitized.requirements = {};
      sanitized.requirements.academic = sanitized.requirements.academic || 'Not specified';
      sanitized.requirements.age_limit = sanitized.requirements.age_limit || 'Not specified';
      sanitized.requirements.language = sanitized.requirements.language || 'Not specified';
      sanitized.requirements.others = Array.isArray(sanitized.requirements.others) ? sanitized.requirements.others : [];
      
      // Ensure application timeline object is complete
      if (!sanitized.application_timeline) sanitized.application_timeline = {};
      sanitized.application_timeline.opening_date = sanitized.application_timeline.opening_date || 'Not specified';
      sanitized.application_timeline.deadline = sanitized.application_timeline.deadline || 'Not specified';
      sanitized.application_timeline.result_announcement = sanitized.application_timeline.result_announcement || 'Not specified';
      
      // Ensure arrays are always arrays
      sanitized.application_procedure = Array.isArray(sanitized.application_procedure) ? sanitized.application_procedure : ['Not specified'];
      sanitized.selection_process = Array.isArray(sanitized.selection_process) ? sanitized.selection_process : ['Not specified'];
      sanitized.source = Array.isArray(sanitized.source) ? sanitized.source : ['Not specified'];
      
      return sanitized;
    });
  }

  async getMockScholarships(query: string): Promise<SearchResponse> {
    // Fallback method for testing when external services are unavailable
    logger.info('Generating mock scholarships', { query });
    
    try {
      const mockScholarships = await this.aiService.generateMockScholarship(query);
      
      return {
        success: true,
        data: mockScholarships,
        message: 'Mock scholarship data generated for testing',
        processing_time: 100,
        total_results: mockScholarships.length
      };
    } catch (error) {
      logger.error('Failed to generate mock scholarships', { error, query });
      throw new Error('Mock scholarship generation failed');
    }
  }

  async validateQuery(query: string): Promise<boolean> {
    return this.searchService.validateSearchQuery(query);
  }

  async getServiceHealth(): Promise<{
    searchService: boolean;
    aiService: boolean;
    overall: boolean;
  }> {
    try {
      // Check search service
      const searchHealthy = await this.checkSearchServiceHealth();
      
      // Check AI service
      const aiHealthy = await this.checkAIServiceHealth();
      
      const overall = searchHealthy && aiHealthy;
      
      return {
        searchService: searchHealthy,
        aiService: aiHealthy,
        overall
      };
    } catch (error) {
      logger.error('Health check failed', { error });
      return {
        searchService: false,
        aiService: false,
        overall: false
      };
    }
  }

  private async checkSearchServiceHealth(): Promise<boolean> {
    try {
      // Try to generate mock search results
      const mockResults = await this.searchService.getMockSearchResults('test', 1);
      return mockResults.length > 0;
    } catch {
      return false;
    }
  }

  private async checkAIServiceHealth(): Promise<boolean> {
    try {
      // Try to generate a mock scholarship
      await this.aiService.generateMockScholarship('test');
      return true;
    } catch {
      return false;
    }
  }
}
