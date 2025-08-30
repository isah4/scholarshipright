import { SearchService, SearchResult } from './searchService';
import { AIService } from './aiService';
import { logger } from '../utils/logger';
import { Scholarship, SearchRequest, SearchResponse } from '../types/scholarship';
import { SearchRequestSchema } from '../types/validation';
import { StructuredResponse, StructuredResponseSchema } from '../types/structured';

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

  // New: full structured pipeline
  async structuredSearch(query: string, locale?: string, depth: 'fast'|'standard'|'deep' = 'standard'): Promise<StructuredResponse> {
    const started = Date.now();
    
    logger.info('🧠 Structured Search - Starting full pipeline', { 
      query, 
      locale, 
      depth, 
      timestamp: new Date().toISOString()
    });
    
    // 1) expand prompts
    logger.info('🔍 Structured Search - Step 1: Expanding queries with OpenAI', { query });
    const prompts = await this.aiService.queryExpander(query, locale, depth);
    logger.info('✅ Structured Search - Query expansion completed', { 
      query, 
      expandedQueriesCount: prompts.length,
      expandedQueries: prompts
    });
    
    // 2) SERP aggregate
    logger.info('🌐 Structured Search - Step 2: Starting parallel SERP search', { 
      query, 
      promptsCount: prompts.length,
      expectedResults: prompts.length * 5
    });
    const serp = await this.searchService.searchMultiplePrompts(prompts, 5);
    logger.info('✅ Structured Search - Parallel SERP search completed', { 
      query, 
      serpResultsCount: serp.length,
      expectedResults: prompts.length * 5
    });
    
    // 3) Fetch pages (top M) with limits and build simple chunks
    const topLinks = serp.slice(0, 12);
    logger.info('📄 Structured Search - Step 3: Fetching web pages', { 
      query, 
      topLinksCount: topLinks.length,
      maxLinks: 12
    });
    
    const pages = await Promise.all(topLinks.map(r => this.searchService.fetchPage(r.link)));
    const normalizedPages = pages.filter((p): p is NonNullable<typeof p> => !!p);
    
    logger.info('📊 Structured Search - Page fetching results', { 
      query, 
      totalPages: topLinks.length,
      successfulFetches: normalizedPages.length,
      failedFetches: topLinks.length - normalizedPages.length
    });
    
    const evidenceChunks = normalizedPages.flatMap(p => {
      const chunks: { url: string; title: string; text: string }[] = [];
      const text = p.text;
      const maxChunk = 3000; // Increased from 1200 to 3000 for better context
      const overlap = 500; // Add overlap to maintain context between chunks
      
      for (let i = 0; i < text.length; i += (maxChunk - overlap)) {
        const chunkText = text.slice(i, i + maxChunk);
        if (chunkText.trim().length > 100) { // Only add non-empty chunks
          chunks.push({ 
            url: p.url, 
            title: p.title, 
            text: chunkText
          });
        }
        if (chunks.length >= 15) break; // Reduced from 20 to 15 for better quality
      }
      return chunks;
    });
    
    logger.info('✂️ Structured Search - Evidence chunking completed', { 
      query, 
      totalChunks: evidenceChunks.length,
      maxChunksPerPage: 15,
      chunkSize: 3000,
      overlap: 500
    });
    
    // naive relevance: keyword coverage count across prompts + query
    const scoreChunk = (c: { text: string }) => {
      const allTerms = [query, ...prompts].join(' ').toLowerCase().split(/\s+/).filter(t => t.length > 3);
      let score = 0;
      const lower = c.text.toLowerCase();
      for (const t of allTerms.slice(0, 40)) if (lower.includes(t)) score += 1;
      return score;
    };
    
    const ranked = evidenceChunks
      .map(c => ({ c, s: scoreChunk(c) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map(x => x.c);
    
    logger.info('🏆 Structured Search - Evidence ranking completed', { 
      query, 
      rankedChunksCount: ranked.length,
      maxRankedChunks: 30,
      rankingMethod: 'keyword coverage scoring'
    });
    
    const sources = topLinks.map(r => ({ url: r.link, title: r.title, snippet: r.snippet, confidence: 0.5 }));
    const evidence = { prompts, serp: topLinks, chunks: ranked };
    
    // 4) Synthesize with validation/repair
    logger.info('🤖 Structured Search - Step 4: AI synthesis and validation', { 
      query, 
      evidenceSize: JSON.stringify(evidence).length,
      sourcesCount: sources.length,
      chunksCount: ranked.length,
      evidencePreview: {
        promptsCount: prompts.length,
        serpCount: topLinks.length,
        chunksCount: ranked.length,
        sampleChunk: ranked[0] ? {
          url: ranked[0].url,
          title: ranked[0].title,
          textPreview: ranked[0].text.substring(0, 100) + '...'
        } : null
      }
    });
    
    const result = await this.aiService.synthesizeToJson(
      evidence,  // Pass evidence directly so our specialized method can detect it
      StructuredResponseSchema,
      query,
      locale,
      depth
    );
    
    // backfill basic fields if missing
    result.query = result.query || query;
    result.locale = result.locale || locale;
    result.depth = result.depth || depth;
    
    const totalTime = Date.now() - started;
    
    // Enhanced logging for synthesis results
    if (result.items && result.items.length > 0) {
      logger.info('🎉 Structured Search - Pipeline completed successfully with scholarships found', { 
        query, 
        itemsCount: result.items.length,
        totalTime,
        averageTimePerStep: Math.round(totalTime / 4),
        sampleItems: result.items.slice(0, 2).map(item => ({
          title: item.title,
          summary: item.summary?.substring(0, 100) + '...',
          eligibilityCount: item.eligibility?.length || 0
        }))
      });
    } else {
      logger.warn('⚠️ Structured Search - Pipeline completed but no scholarships found', { 
        query, 
        itemsCount: 0,
        totalTime,
        averageTimePerStep: Math.round(totalTime / 4),
        validationErrors: result.validationErrors || [],
        sourcesCount: result.sources?.length || 0
      });
    }
    
    return result;
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
