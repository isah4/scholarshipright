"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const p_queue_1 = __importDefault(require("p-queue"));
const cheerio = __importStar(require("cheerio"));
const cache_1 = require("../utils/cache");
const circuitBreaker_1 = require("../utils/circuitBreaker");
class SearchService {
    constructor() {
        this.serpApiKey = config_1.config.serpapi.apiKey || null;
        this.queue = new p_queue_1.default({
            concurrency: parseInt(process.env.SERP_CONCURRENCY || '3', 10),
            interval: 1000,
            intervalCap: parseInt(process.env.SERP_INTERVAL_CAP || '6', 10)
        });
        this.pageCache = new cache_1.TTLCache(parseInt(process.env.PAGE_CACHE_TTL_MS || '1800000', 10), parseInt(process.env.PAGE_CACHE_MAX || '500', 10));
        this.serpBreaker = new circuitBreaker_1.CircuitBreaker(5, 15000);
        this.fetchBreaker = new circuitBreaker_1.CircuitBreaker(5, 15000);
        if (!this.serpApiKey) {
            logger_1.logger.warn('SerpAPI key not provided, will use mock data only');
        }
    }
    async searchMultiplePrompts(prompts, topKPerPrompt = 5) {
        if (!prompts || prompts.length === 0)
            return [];
        logger_1.logger.info('🚀 Parallel Search - Starting multiple prompt search', {
            promptsCount: prompts.length,
            topKPerPrompt,
            prompts: prompts
        });
        const startTime = Date.now();
        const tasks = prompts.map((prompt, index) => {
            logger_1.logger.info(`📋 Parallel Search - Queuing task ${index + 1}`, {
                taskId: index + 1,
                prompt: prompt.substring(0, 80) + '...',
                promptLength: prompt.length
            });
            return this.queue.add(() => this.performWebSearch(prompt, topKPerPrompt));
        });
        logger_1.logger.info('⚡ Parallel Search - Executing all tasks simultaneously', {
            totalTasks: tasks.length,
            expectedResults: prompts.length * topKPerPrompt
        });
        const results = await Promise.allSettled(tasks);
        const executionTime = Date.now() - startTime;
        const flat = [];
        const successful = [];
        const failed = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                flat.push(...result.value);
                successful.push(i + 1);
                logger_1.logger.info(`✅ Parallel Search - Task ${i + 1} completed successfully`, {
                    taskId: i + 1,
                    resultsCount: result.value.length,
                    prompt: prompts[i].substring(0, 60) + '...'
                });
            }
            else if (result.status === 'rejected') {
                failed.push(i + 1);
                logger_1.logger.error(`❌ Parallel Search - Task ${i + 1} failed`, {
                    taskId: i + 1,
                    prompt: prompts[i].substring(0, 60) + '...',
                    error: result.reason
                });
            }
        }
        logger_1.logger.info('📊 Parallel Search - Results summary', {
            totalTime: executionTime,
            successfulTasks: successful.length,
            failedTasks: failed.length,
            totalResults: flat.length,
            expectedResults: prompts.length * topKPerPrompt,
            successRate: `${Math.round((successful.length / prompts.length) * 100)}%`
        });
        const byUrl = new Map();
        for (const item of flat) {
            if (!byUrl.has(item.link))
                byUrl.set(item.link, item);
        }
        const urlDeduped = Array.from(byUrl.values());
        logger_1.logger.info('🧹 Parallel Search - Deduplication results', {
            beforeDedup: flat.length,
            afterUrlDedup: urlDeduped.length,
            duplicatesRemoved: flat.length - urlDeduped.length
        });
        const byDomain = new Map();
        for (const item of urlDeduped) {
            const domain = this.extractDomain(item.link);
            if (!byDomain.has(domain))
                byDomain.set(domain, []);
            byDomain.get(domain).push(item);
        }
        const diversified = [];
        const domainIter = Array.from(byDomain.entries());
        let added = true;
        while (added) {
            added = false;
            for (const [, arr] of domainIter) {
                const next = arr.shift();
                if (next) {
                    diversified.push(next);
                    added = true;
                }
            }
        }
        logger_1.logger.info('🎯 Parallel Search - Final results', {
            finalResultsCount: diversified.length,
            uniqueDomains: byDomain.size,
            diversityStrategy: 'round-robin domain distribution'
        });
        return diversified;
    }
    async fetchPage(url) {
        try {
            if (!this.fetchBreaker.canRequest())
                return null;
            const cached = this.pageCache.get(url);
            if (cached)
                return { url, title: cached.title, text: cached.text };
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), parseInt(process.env.PAGE_FETCH_TIMEOUT_MS || '8000', 10));
            const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ScholarshipRightBot/1.0' } });
            clearTimeout(timeout);
            if (!res.ok) {
                this.fetchBreaker.failure();
                return null;
            }
            const buf = await res.arrayBuffer();
            const maxBytes = parseInt(process.env.PAGE_FETCH_MAX_BYTES || '1048576', 10);
            const bytes = new Uint8Array(buf).slice(0, maxBytes);
            const html = new TextDecoder('utf-8').decode(bytes);
            const $ = cheerio.load(html);
            const title = $('title').first().text() || 'Untitled';
            $('script,noscript,style,svg,footer,nav,form,iframe').remove();
            const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, parseInt(process.env.PAGE_TEXT_MAX_CHARS || '20000', 10));
            this.pageCache.set(url, { title, text });
            this.fetchBreaker.success();
            return { url, title, text };
        }
        catch {
            this.fetchBreaker.failure();
            return null;
        }
    }
    async searchScholarships(query, limit = 5) {
        try {
            logger_1.logger.info('🔍 Standard Search - Starting single query search', { query, limit });
            if (!this.serpApiKey) {
                logger_1.logger.info('⚠️ Standard Search - No API key available, using mock search results', { query });
                return await this.getMockSearchResults(query, limit);
            }
            logger_1.logger.info('🌐 Standard Search - Calling SERP API', { query, limit });
            const searchResults = await this.performWebSearch(query, limit);
            logger_1.logger.info('✅ Standard Search - SERP API completed', {
                query,
                resultsCount: searchResults.length,
                source: 'SERP API'
            });
            return searchResults;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('❌ Standard Search - SERP API failed, falling back to mock data', {
                error: errorMessage,
                query
            });
            logger_1.logger.info('🔄 Standard Search - Using mock search results as fallback', { query });
            return await this.getMockSearchResults(query, limit);
        }
    }
    async performWebSearch(query, limit) {
        try {
            if (!this.serpBreaker.canRequest()) {
                throw new Error('SERP circuit open');
            }
            if (!this.serpApiKey) {
                throw new Error('No API key available');
            }
            const searchQuery = `${query} scholarship application deadline requirements benefits`;
            const response = await axios_1.default.get('https://serpapi.com/search', {
                params: {
                    q: searchQuery,
                    api_key: this.serpApiKey,
                    engine: 'google',
                    num: limit,
                    gl: 'us',
                    hl: 'en',
                    safe: 'active'
                },
                timeout: parseInt(process.env.SERP_TIMEOUT_MS || '10000', 10)
            });
            if (!response.data || !response.data.organic_results) {
                throw new Error('Invalid response from search API');
            }
            const results = response.data.organic_results.slice(0, limit);
            this.serpBreaker.success();
            return results.map((result) => ({
                title: result.title || 'No title',
                link: result.link || '',
                snippet: result.snippet || 'No description available',
                source: this.extractDomain(result.link)
            }));
        }
        catch (error) {
            this.serpBreaker.failure();
            if (axios_1.default.isAxiosError(error)) {
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
    extractDomain(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        }
        catch {
            return 'Unknown source';
        }
    }
    async getMockSearchResults(query, limit = 5) {
        logger_1.logger.info('Generating mock search results', { query, limit });
        const mockResults = [
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
    async validateSearchQuery(query) {
        if (!query || typeof query !== 'string') {
            return false;
        }
        if (query.trim().length < 2) {
            return false;
        }
        if (query.length > 500) {
            return false;
        }
        const harmfulPatterns = [
            /<script>/i,
            /javascript:/i,
            /data:/i,
            /vbscript:/i
        ];
        return !harmfulPatterns.some(pattern => pattern.test(query));
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=searchService.js.map