"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const validation_1 = require("../types/validation");
const structured_1 = require("../types/structured");
class AIService {
    constructor() {
        if (!config_1.config.openai.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.openai = new openai_1.default({
            apiKey: config_1.config.openai.apiKey
        });
    }
    async queryExpander(query, locale, depth = 'standard') {
        const targetCount = depth === 'fast' ? 3 : depth === 'deep' ? 6 : 5;
        const system = 'You generate diversified, distinct search prompts for web search. Output JSON only: {"prompts": string[]}. Avoid near-duplicates; cover who/what/where/when/how, synonyms, and regional/academic/industry angles.';
        const user = `Query: ${query}\nLocale: ${locale || 'en'}\nCount: ${targetCount}`;
        const completion = await this.openai.chat.completions.create({
            model: config_1.config.openai.model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
            temperature: 0.7,
            max_tokens: 400,
            response_format: { type: 'json_object' }
        });
        const raw = completion.choices[0]?.message?.content || '{"prompts":[]}';
        let prompts = [];
        try {
            prompts = JSON.parse(raw).prompts || [];
        }
        catch {
            prompts = [];
        }
        const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
        const unique = [];
        const tooSimilar = (a, b) => {
            const na = norm(a), nb = norm(b);
            if (na === nb)
                return true;
            const sa = new Set(na.split(' '));
            const sb = new Set(nb.split(' '));
            const inter = [...sa].filter(x => sb.has(x)).length;
            const union = new Set([...sa, ...sb]).size;
            const jaccard = inter / Math.max(1, union);
            return jaccard > 0.75;
        };
        for (const p of prompts) {
            if (!p || typeof p !== 'string')
                continue;
            if (unique.some(u => tooSimilar(u, p)))
                continue;
            unique.push(p.trim());
            if (unique.length >= targetCount)
                break;
        }
        while (unique.length < Math.max(3, targetCount)) {
            unique.push(`${query} scholarships requirements deadlines ${(unique.length + 1)}`);
        }
        return unique.slice(0, targetCount);
    }
    async synthesizeToJson(evidence, schema, query, locale, depth = 'standard') {
        const system = 'You are a strict JSON generator. Output ONLY valid JSON that conforms exactly to the provided JSON Schema. Include citations passed in evidence. No prose.';
        const schemaString = JSON.stringify(schema._def, null, 0);
        const messages = [
            { role: 'system', content: system },
            { role: 'user', content: `Query: ${query}\nLocale: ${locale || 'en'}\nDepth: ${depth}\nEvidence (compact):\n${JSON.stringify(evidence).slice(0, 12000)}\nJSON Schema (types/examples implied by keys):\n${schemaString}` }
        ];
        const first = await this.openai.chat.completions.create({
            model: config_1.config.openai.model,
            messages,
            temperature: 0.1,
            max_tokens: 3000,
            response_format: { type: 'json_object' }
        });
        let content = first.choices[0]?.message?.content || '{}';
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch {
            parsed = {};
        }
        const validate = () => structured_1.StructuredResponseSchema.safeParse(parsed);
        let result = validate();
        if (!result.success) {
            const repair = await this.openai.chat.completions.create({
                model: config_1.config.openai.model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: `Fix this JSON to satisfy the schema and keep semantics. Return JSON only.\nOriginal:\n${content}\nSchema:\n${schemaString}` }
                ],
                temperature: 0,
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            });
            content = repair.choices[0]?.message?.content || '{}';
            try {
                parsed = JSON.parse(content);
            }
            catch {
                parsed = {};
            }
            result = validate();
            if (!result.success) {
                const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                return { query, locale, depth, items: [], sources: [], validationErrors: errors };
            }
        }
        return result.data;
    }
    async processScholarshipData(rawData, query) {
        try {
            logger_1.logger.info('Processing scholarship data with AI', { query, dataLength: rawData.length });
            const prompt = this.buildPrompt(query, rawData);
            const completion = await this.openai.chat.completions.create({
                model: config_1.config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert scholarship data analyst. Extract and structure scholarship information into valid JSON matching the exact schema provided. Always return complete, valid JSON.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 6000,
                response_format: { type: "json_object" }
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }
            let parsedData;
            try {
                parsedData = JSON.parse(response);
            }
            catch (parseError) {
                logger_1.logger.error('Failed to parse AI response', { response, error: parseError });
                throw new Error('Invalid JSON response from AI service');
            }
            const validatedData = this.validateAndNormalizeData(parsedData);
            logger_1.logger.info('Successfully processed scholarship data', {
                count: validatedData.length,
                query
            });
            return validatedData;
        }
        catch (error) {
            logger_1.logger.error('AI service error', { error, query });
            throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildPrompt(query, rawData) {
        const truncatedData = rawData.length > 2000 ? rawData.substring(0, 2000) + '...' : rawData;
        return `Analyze this scholarship data for "${query}" and return valid JSON matching this schema:

{
  "scholarships": [
    {
      "title": "Full scholarship name",
      "scholarship_type": "fully funded|partial high|partial low",
      "degree_levels": ["Bachelor", "Masters", "PhD", "Postdoctoral"],
      "host_country": "Country name",
      "benefits": {
        "tuition": "Tuition coverage details",
        "stipend": "Monthly/annual stipend amount", 
        "travel": "Airfare/transport coverage",
        "insurance": "Health/medical insurance coverage",
        "others": ["Additional benefits"]
      },
      "eligible_countries": "All countries or specific countries",
      "requirements": {
        "academic": "GPA, degree requirements",
        "age_limit": "Age restrictions or 'No age limit'",
        "language": "Language requirements (English, IELTS, etc.)",
        "others": ["Other conditions"]
      },
      "application_timeline": {
        "opening_date": "Application opening date",
        "deadline": "Application deadline",
        "result_announcement": "Result notification period"
      },
      "application_link": "Direct application URL",
      "application_procedure": ["Step 1", "Step 2", "Step 3"],
      "selection_process": ["Evaluation criteria", "Interview rounds"],
      "renewal": "Renewal rules or 'Not applicable'",
      "source": ["Source URLs"]
    }
  ]
}

RAW DATA:
${truncatedData}

RULES: Return ONLY valid JSON. Use "Not specified" for missing info. Ensure all fields are present.`;
    }
    validateAndNormalizeData(data) {
        try {
            if (!data.scholarships || !Array.isArray(data.scholarships)) {
                throw new Error('Invalid data structure: missing scholarships array');
            }
            const validatedScholarships = [];
            for (const scholarship of data.scholarships) {
                try {
                    const sanitizedScholarship = this.sanitizeScholarshipData(scholarship);
                    const validated = validation_1.ScholarshipSchema.parse(sanitizedScholarship);
                    validatedScholarships.push(validated);
                }
                catch (validationError) {
                    logger_1.logger.warn('Scholarship validation failed, attempting to fix', {
                        scholarship: scholarship.title || 'Unknown',
                        error: validationError
                    });
                    try {
                        const fixedScholarship = this.fixCommonIssues(scholarship);
                        const validated = validation_1.ScholarshipSchema.parse(fixedScholarship);
                        validatedScholarships.push(validated);
                        logger_1.logger.info('Successfully fixed and validated scholarship', { title: scholarship.title });
                    }
                    catch (fixError) {
                        logger_1.logger.warn('Failed to fix scholarship, skipping', {
                            title: scholarship.title,
                            error: fixError
                        });
                    }
                }
            }
            if (validatedScholarships.length === 0) {
                throw new Error('No valid scholarships found after validation');
            }
            return validatedScholarships;
        }
        catch (error) {
            logger_1.logger.error('Data validation failed', { error, data });
            throw new Error(`Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    sanitizeScholarshipData(scholarship) {
        const sanitized = JSON.parse(JSON.stringify(scholarship));
        if (!sanitized.title)
            sanitized.title = 'Unknown Scholarship';
        if (!sanitized.scholarship_type)
            sanitized.scholarship_type = 'fully funded';
        if (!sanitized.degree_levels || !Array.isArray(sanitized.degree_levels)) {
            sanitized.degree_levels = ['Masters'];
        }
        if (!sanitized.host_country)
            sanitized.host_country = 'Not specified';
        if (!sanitized.benefits)
            sanitized.benefits = {};
        if (!sanitized.requirements)
            sanitized.requirements = {};
        if (!sanitized.application_timeline)
            sanitized.application_timeline = {};
        if (!sanitized.application_procedure || !Array.isArray(sanitized.application_procedure)) {
            sanitized.application_procedure = ['Not specified'];
        }
        if (!sanitized.selection_process || !Array.isArray(sanitized.selection_process)) {
            sanitized.selection_process = ['Not specified'];
        }
        if (!sanitized.source || !Array.isArray(sanitized.source)) {
            sanitized.source = ['Not specified'];
        }
        return sanitized;
    }
    fixCommonIssues(scholarship) {
        const fixed = { ...scholarship };
        if (fixed.benefits) {
            if (!fixed.benefits.tuition)
                fixed.benefits.tuition = 'Not specified';
            if (!fixed.benefits.stipend)
                fixed.benefits.stipend = 'Not specified';
            if (!fixed.benefits.travel)
                fixed.benefits.travel = 'Not specified';
            if (!fixed.benefits.insurance)
                fixed.benefits.insurance = 'Not specified';
            if (!Array.isArray(fixed.benefits.others))
                fixed.benefits.others = [];
        }
        if (fixed.requirements) {
            if (!fixed.requirements.academic)
                fixed.requirements.academic = 'Not specified';
            if (!fixed.requirements.age_limit)
                fixed.requirements.age_limit = 'Not specified';
            if (!fixed.requirements.language)
                fixed.requirements.language = 'Not specified';
            if (!Array.isArray(fixed.requirements.others))
                fixed.requirements.others = [];
        }
        if (fixed.application_timeline) {
            if (!fixed.application_timeline.opening_date)
                fixed.application_timeline.opening_date = 'Not specified';
            if (!fixed.application_timeline.deadline)
                fixed.application_timeline.deadline = 'Not specified';
            if (!fixed.application_timeline.result_announcement)
                fixed.application_timeline.result_announcement = 'Not specified';
        }
        if (!fixed.application_link)
            fixed.application_link = 'https://example.com/not-specified';
        if (!fixed.renewal)
            fixed.renewal = 'Not specified';
        return fixed;
    }
    async generateMockScholarship(query) {
        logger_1.logger.info('Generating mock scholarship data', { query });
        const mockScholarship = {
            title: `Mock Scholarship for ${query}`,
            scholarship_type: "fully funded",
            degree_levels: ["Masters", "PhD"],
            host_country: "United States",
            benefits: {
                tuition: "Full tuition coverage",
                stipend: "$25,000 per year",
                travel: "Round-trip airfare",
                insurance: "Comprehensive health insurance",
                others: ["Books and materials", "Conference travel"]
            },
            eligible_countries: "All countries",
            requirements: {
                academic: "Minimum GPA 3.5",
                age_limit: "No age limit",
                language: "IELTS 7.0 or TOEFL 100",
                others: ["Research proposal required"]
            },
            application_timeline: {
                opening_date: "January 1, 2025",
                deadline: "March 31, 2025",
                result_announcement: "May 15, 2025"
            },
            application_link: "https://example.com/apply",
            application_procedure: [
                "Submit online application",
                "Upload required documents",
                "Pay application fee",
                "Submit references"
            ],
            selection_process: [
                "Document review",
                "Interview with committee",
                "Final selection"
            ],
            renewal: "Annual renewal based on academic performance",
            source: ["https://example.com/scholarship"]
        };
        return [mockScholarship];
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map