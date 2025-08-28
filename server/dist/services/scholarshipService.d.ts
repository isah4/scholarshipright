import { SearchRequest, SearchResponse } from '../types/scholarship';
import { StructuredResponse } from '../types/structured';
export declare class ScholarshipService {
    private searchService;
    private aiService;
    constructor();
    searchScholarships(request: SearchRequest): Promise<SearchResponse>;
    structuredSearch(query: string, locale?: string, depth?: 'fast' | 'standard' | 'deep'): Promise<StructuredResponse>;
    private prepareRawData;
    private sanitizeResponseData;
    getMockScholarships(query: string): Promise<SearchResponse>;
    validateQuery(query: string): Promise<boolean>;
    getServiceHealth(): Promise<{
        searchService: boolean;
        aiService: boolean;
        overall: boolean;
    }>;
    private checkSearchServiceHealth;
    private checkAIServiceHealth;
}
//# sourceMappingURL=scholarshipService.d.ts.map