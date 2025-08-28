import { Scholarship } from '../types/scholarship';
import { z } from 'zod';
import { StructuredResponse } from '../types/structured';
export declare class AIService {
    private openai;
    constructor();
    queryExpander(query: string, locale?: string, depth?: 'fast' | 'standard' | 'deep'): Promise<string[]>;
    synthesizeToJson(evidence: any, schema: z.ZodTypeAny, query: string, locale?: string, depth?: 'fast' | 'standard' | 'deep'): Promise<StructuredResponse>;
    processScholarshipData(rawData: string, query: string): Promise<Scholarship[]>;
    private buildPrompt;
    private validateAndNormalizeData;
    private sanitizeScholarshipData;
    private fixCommonIssues;
    generateMockScholarship(query: string): Promise<Scholarship[]>;
}
//# sourceMappingURL=aiService.d.ts.map