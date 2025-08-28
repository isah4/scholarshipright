import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export class SearchService {
  private serpApiKey: string | null;

  constructor() {
    this.serpApiKey = config.serpapi.apiKey || null;
    
    if (!this.serpApiKey) {
      logger.warn('SerpAPI key not provided, will use mock data only');
    }
  }

  async searchScholarships(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      logger.info('Searching for scholarships', { query, limit });
      
      // If no API key, use mock data
      if (!this.serpApiKey) {
        logger.info('No API key available, using mock search results');
        return await this.getMockSearchResults(query, limit);
      }
      
      const searchResults = await this.performWebSearch(query, limit);
      
      logger.info('Search completed', { 
        query, 
        resultsCount: searchResults.length 
      });
      
      return searchResults;
    } catch (error) {
      logger.error('Search service error', { error, query });
      logger.info('Falling back to mock search results');
      return await this.getMockSearchResults(query, limit);
    }
  }

  private async performWebSearch(query: string, limit: number): Promise<SearchResult[]> {
    try {
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
        timeout: 10000 // 10 second timeout
      });

      if (!response.data || !response.data.organic_results) {
        throw new Error('Invalid response from search API');
      }

      const results = response.data.organic_results.slice(0, limit);
      
      return results.map((result: any) => ({
        title: result.title || 'No title',
        link: result.link || '',
        snippet: result.snippet || 'No description available',
        source: this.extractDomain(result.link)
      }));

    } catch (error) {
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
