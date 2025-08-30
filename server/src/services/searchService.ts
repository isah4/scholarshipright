import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import PQueue from 'p-queue';
import * as cheerio from 'cheerio';
import { TTLCache } from '../utils/cache';
import { CircuitBreaker } from '../utils/circuitBreaker';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export class SearchService {
  private serpApiKey: string | null;
  private queue: PQueue;
  private pageCache: TTLCache<string, { text: string; title: string }>;
  private serpBreaker: CircuitBreaker;
  private fetchBreaker: CircuitBreaker;

  constructor() {
    this.serpApiKey = config.serpapi.apiKey || null;
    this.queue = new PQueue({
      concurrency: parseInt(process.env.SERP_CONCURRENCY || '3', 10),
      interval: 1000,
      intervalCap: parseInt(process.env.SERP_INTERVAL_CAP || '6', 10)
    });
    this.pageCache = new TTLCache<string, { text: string; title: string }>(
      parseInt(process.env.PAGE_CACHE_TTL_MS || '1800000', 10),
      parseInt(process.env.PAGE_CACHE_MAX || '500', 10)
    );
    this.serpBreaker = new CircuitBreaker(5, 15000);
    this.fetchBreaker = new CircuitBreaker(5, 15000);
    
    if (!this.serpApiKey) {
      logger.warn('SerpAPI key not provided, will use mock data only');
    }
  }

  // Multi-prompt search with parallelism, retries, and dedupe
  async searchMultiplePrompts(prompts: string[], topKPerPrompt: number = 5): Promise<SearchResult[]> {
    if (!prompts || prompts.length === 0) return [];
    
    logger.info('🚀 Parallel Search - Starting multiple prompt search', { 
      promptsCount: prompts.length, 
      topKPerPrompt,
      prompts: prompts
    });
    
    const startTime = Date.now();
    
    // Create search tasks
    const tasks = prompts.map((prompt, index) => {
      logger.info(`📋 Parallel Search - Queuing task ${index + 1}`, { 
        taskId: index + 1, 
        prompt: prompt.substring(0, 80) + '...',
        promptLength: prompt.length
      });
      return this.queue.add(() => this.performWebSearch(prompt, topKPerPrompt)) as Promise<SearchResult[]>;
    });
    
    logger.info('⚡ Parallel Search - Executing all tasks simultaneously', { 
      totalTasks: tasks.length,
      expectedResults: prompts.length * topKPerPrompt
    });
    
    // Execute all searches in parallel
    const results = await Promise.allSettled(tasks as Promise<SearchResult[]>[]);
    
    const executionTime = Date.now() - startTime;
    
    // Process results
    const flat: SearchResult[] = [];
    const successful: number[] = [];
    const failed: number[] = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        flat.push(...result.value);
        successful.push(i + 1);
        logger.info(`✅ Parallel Search - Task ${i + 1} completed successfully`, { 
          taskId: i + 1,
          resultsCount: result.value.length,
          prompt: prompts[i].substring(0, 60) + '...'
        });
      } else if (result.status === 'rejected') {
        failed.push(i + 1);
        logger.error(`❌ Parallel Search - Task ${i + 1} failed`, { 
          taskId: i + 1,
          prompt: prompts[i].substring(0, 60) + '...',
          error: result.reason
        });
      }
    }
    
    logger.info('📊 Parallel Search - Results summary', { 
      totalTime: executionTime,
      successfulTasks: successful.length,
      failedTasks: failed.length,
      totalResults: flat.length,
      expectedResults: prompts.length * topKPerPrompt,
      successRate: `${Math.round((successful.length / prompts.length) * 100)}%`
    });
    
    // dedupe by URL and then by domain keeping diverse set
    const byUrl = new Map<string, SearchResult>();
    for (const item of flat) {
      if (!byUrl.has(item.link)) byUrl.set(item.link, item);
    }
    const urlDeduped = Array.from(byUrl.values());
    
    logger.info('🧹 Parallel Search - Deduplication results', { 
      beforeDedup: flat.length,
      afterUrlDedup: urlDeduped.length,
      duplicatesRemoved: flat.length - urlDeduped.length
    });
    
    const byDomain = new Map<string, SearchResult[]>();
    for (const item of urlDeduped) {
      const domain = this.extractDomain(item.link);
      if (!byDomain.has(domain)) byDomain.set(domain, []);
      byDomain.get(domain)!.push(item);
    }
    
    const diversified: SearchResult[] = [];
    const domainIter = Array.from(byDomain.entries());
    // round-robin domains to increase diversity
    let added = true;
    while (added) {
      added = false;
      for (const [, arr] of domainIter) {
        const next = arr.shift();
        if (next) { diversified.push(next); added = true; }
      }
    }
    
    logger.info('🎯 Parallel Search - Final results', { 
      finalResultsCount: diversified.length,
      uniqueDomains: byDomain.size,
      diversityStrategy: 'round-robin domain distribution'
    });
    
    return diversified;
  }

  // Fetch and extract readable text from a page with size/time limits
  async fetchPage(url: string): Promise<{ url: string; title: string; text: string } | null> {
    try {
      if (!this.fetchBreaker.canRequest()) return null;
      const cached = this.pageCache.get(url);
      if (cached) return { url, title: cached.title, text: cached.text };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), parseInt(process.env.PAGE_FETCH_TIMEOUT_MS || '8000', 10));
      const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ScholarshipRightBot/1.0' } as any } as any);
      clearTimeout(timeout);
      if (!res.ok) { this.fetchBreaker.failure(); return null; }
      const buf = await res.arrayBuffer();
      const maxBytes = parseInt(process.env.PAGE_FETCH_MAX_BYTES || '1048576', 10); // 1MB
      const bytes = new Uint8Array(buf).slice(0, maxBytes);
      const html = new TextDecoder('utf-8').decode(bytes);
      const $ = cheerio.load(html);
      const title = $('title').first().text() || 'Untitled';
      // basic boilerplate removal
      $('script,noscript,style,svg,footer,nav,form,iframe').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, parseInt(process.env.PAGE_TEXT_MAX_CHARS || '20000', 10));
      this.pageCache.set(url, { title, text });
      this.fetchBreaker.success();
      return { url, title, text };
    } catch {
      this.fetchBreaker.failure();
      return null;
    }
  }

  async searchScholarships(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      logger.info('🔍 Standard Search - Starting single query search', { query, limit });
      
      // If no API key, use mock data
      if (!this.serpApiKey) {
        logger.info('⚠️ Standard Search - No API key available, using mock search results', { query });
        return await this.getMockSearchResults(query, limit);
      }
      
      logger.info('🌐 Standard Search - Calling SERP API', { query, limit });
      const searchResults = await this.performWebSearch(query, limit);
      
      logger.info('✅ Standard Search - SERP API completed', { 
        query, 
        resultsCount: searchResults.length,
        source: 'SERP API'
      });
      
      return searchResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Standard Search - SERP API failed, falling back to mock data', { 
        error: errorMessage, 
        query 
      });
      logger.info('🔄 Standard Search - Using mock search results as fallback', { query });
      return await this.getMockSearchResults(query, limit);
    }
  }

  private async performWebSearch(query: string, limit: number): Promise<SearchResult[]> {
    try {
      if (!this.serpBreaker.canRequest()) {
        throw new Error('SERP circuit open');
      }
      if (!this.serpApiKey) {
        throw new Error('No API key available');
      }

      // Search for scholarship information
      const searchQuery = `${query} scholarship application deadline requirements benefits`;
      
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: searchQuery,
          api_key: this.serpApiKey,
          engine: 'google',
          num: limit,
          gl: 'us', // Geographic location
          hl: 'en', // Language
          safe: 'active'
        },
        timeout: parseInt(process.env.SERP_TIMEOUT_MS || '10000', 10)
      });

      if (!response.data || !response.data.organic_results) {
        throw new Error('Invalid response from search API');
      }

      const results = response.data.organic_results.slice(0, limit);
      this.serpBreaker.success();
      
      return results.map((result: any) => ({
        title: result.title || 'No title',
        link: result.link || '',
        snippet: result.snippet || 'No description available',
        source: this.extractDomain(result.link)
      }));

    } catch (error) {
      this.serpBreaker.failure();
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Search request timed out');
        }
        if (error.response?.status === 429) {
          throw new Error('Search API rate limit exceeded');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid search API key');
        }
        throw new Error(`Search API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Unknown source';
    }
  }

  async getMockSearchResults(query: string, limit: number = 5): Promise<SearchResult[]> {
    // Fallback mock data for testing when search service is unavailable
    logger.info('Generating mock search results', { query, limit });
    
    const mockResults: SearchResult[] = [
      {
        title: `${query} Scholarship Program 2025`,
        link: 'https://example-scholarship.org/apply',
        snippet: `Apply for the ${query} scholarship program. This fully funded opportunity covers tuition, living expenses, and travel costs for international students.`,
        source: 'example-scholarship.org'
      },
      {
        title: `${query} University Scholarship Application`,
        link: 'https://university.edu/scholarships',
        snippet: `Complete guide to applying for ${query} scholarships at our university. Learn about requirements, deadlines, and application procedures.`,
        source: 'university.edu'
      },
      {
        title: `${query} Scholarship Requirements and Benefits`,
        link: 'https://scholarship-guide.com/requirements',
        snippet: `Detailed information about ${query} scholarship eligibility criteria, benefits, and application timeline.`,
        source: 'scholarship-guide.com'
      },
      {
        title: `${query} International Student Scholarship`,
        link: 'https://international-scholarships.org/apply',
        snippet: `International students can apply for ${query} scholarships. Includes application process, eligibility requirements, and funding details.`,
        source: 'international-scholarships.org'
      },
      {
        title: `${query} Scholarship Application Guide`,
        link: 'https://scholarship-help.com/guide',
        snippet: `Step-by-step guide to applying for ${query} scholarships. Tips for successful applications and common mistakes to avoid.`,
        source: 'scholarship-help.com'
      }
    ];

    return mockResults.slice(0, limit);
  }

  async validateSearchQuery(query: string): Promise<boolean> {
    // Basic validation for search queries
    if (!query || typeof query !== 'string') {
      return false;
    }
    
    if (query.trim().length < 2) {
      return false;
    }
    
    if (query.length > 500) {
      return false;
    }
    
    // Check for potentially harmful content
    const harmfulPatterns = [
      /<script>/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i
    ];
    
    return !harmfulPatterns.some(pattern => pattern.test(query));
  }
}
