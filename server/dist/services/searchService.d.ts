export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    source: string;
}
export declare class SearchService {
    private serpApiKey;
    private queue;
    private pageCache;
    private serpBreaker;
    private fetchBreaker;
    constructor();
    searchMultiplePrompts(prompts: string[], topKPerPrompt?: number): Promise<SearchResult[]>;
    fetchPage(url: string): Promise<{
        url: string;
        title: string;
        text: string;
    } | null>;
    searchScholarships(query: string, limit?: number): Promise<SearchResult[]>;
    private performWebSearch;
    private extractDomain;
    getMockSearchResults(query: string, limit?: number): Promise<SearchResult[]>;
    validateSearchQuery(query: string): Promise<boolean>;
}
//# sourceMappingURL=searchService.d.ts.map