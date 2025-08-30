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
        const system = 'You are a scholarship search specialist. Generate ONLY scholarship-related search queries. Output JSON only: {"prompts": string[]}. Focus on: scholarships, grants, funding, financial aid, academic opportunities, university programs, degree funding, research grants, student financial support. Avoid general topics - every query must be scholarship/funding related.';
        const user = `Query: ${query}\nLocale: ${locale || 'en'}\nCount: ${targetCount}\n\nIMPORTANT: Transform this query into ${targetCount} scholarship-specific search queries. If the original query is not scholarship-related, add scholarship/funding context. Examples:\n- "indonesia" → "Indonesia scholarships for international students", "Indonesian government scholarships", "University scholarships in Indonesia"\n- "computer science" → "Computer science scholarships", "CS degree funding opportunities", "Tech scholarships for students"\n\nEvery generated query must include scholarship, funding, grant, or financial aid terms.`;
        logger_1.logger.info('🤖 OpenAI Query Expansion - Starting', {
            query,
            locale,
            depth,
            targetCount,
            systemPrompt: system.substring(0, 100) + '...',
            userPrompt: user.substring(0, 100) + '...'
        });
        const startTime = Date.now();
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
        const responseTime = Date.now() - startTime;
        const raw = completion.choices[0]?.message?.content || '{"prompts":[]}';
        logger_1.logger.info('✅ OpenAI Query Expansion - Response received', {
            query,
            responseTime,
            rawResponse: raw.substring(0, 200) + '...',
            responseLength: raw.length
        });
        let prompts = [];
        try {
            prompts = JSON.parse(raw).prompts || [];
            logger_1.logger.info('🔍 OpenAI Query Expansion - Parsed successfully', {
                query,
                promptsCount: prompts.length,
                prompts: prompts
            });
        }
        catch (parseError) {
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
            logger_1.logger.error('❌ OpenAI Query Expansion - JSON parse failed', {
                query,
                rawResponse: raw,
                error: errorMessage
            });
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
            const scholarshipKeywords = ['scholarship', 'grant', 'funding', 'financial aid', 'tuition', 'degree', 'university', 'college', 'student', 'academic', 'research'];
            const lowerPrompt = p.toLowerCase();
            const isScholarshipRelated = scholarshipKeywords.some(keyword => lowerPrompt.includes(keyword));
            if (!isScholarshipRelated) {
                logger_1.logger.warn('OpenAI Query Expansion - Generated non-scholarship query, filtering out', {
                    query,
                    filteredPrompt: p,
                    reason: 'No scholarship-related keywords found'
                });
                continue;
            }
            if (unique.some(u => tooSimilar(u, p)))
                continue;
            unique.push(p.trim());
            if (unique.length >= targetCount)
                break;
        }
        while (unique.length < Math.max(3, targetCount)) {
            const scholarshipTerms = ['scholarships', 'grants', 'funding', 'financial aid'];
            const term = scholarshipTerms[unique.length % scholarshipTerms.length];
            unique.push(`${query} ${term} for students`);
        }
        return unique.slice(0, targetCount);
    }
    async synthesizeToJson(evidence, schema, query, locale, depth = 'standard') {
        logger_1.logger.info('🤖 AI Synthesis - Starting synthesis', {
            query,
            evidenceType: typeof evidence,
            hasChunks: evidence?.chunks ? 'yes' : 'no',
            chunksCount: evidence?.chunks?.length || 0,
            evidenceKeys: evidence ? Object.keys(evidence) : []
        });
        if (evidence.chunks && Array.isArray(evidence.chunks)) {
            logger_1.logger.info('🎯 AI Synthesis - Using specialized scholarship synthesis', { query });
            return this.synthesizeScholarshipData(evidence, query, locale, depth);
        }
        logger_1.logger.info('🔧 AI Synthesis - Using generic synthesis', { query });
        const system = 'You are a strict JSON generator. Output ONLY valid JSON that conforms exactly to the provided JSON Schema. Include citations passed in evidence. No prose.';
        const schemaString = JSON.stringify(schema._def, null, 0);
        const messages = [
            { role: 'system', content: system },
            { role: 'user', content: `Query: ${query}\nLocale: ${locale || 'en'}\nDepth: ${depth}\nEvidence (compact):\n${JSON.stringify(evidence).slice(0, 12000)}\nJSON Schema (types/examples implied by keys):\n${schemaString}` }
        ];
        try {
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
        catch (error) {
            logger_1.logger.error('Generic synthesis failed', { error, query });
            return { query, locale, depth, items: [], sources: [], validationErrors: [`Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
        }
    }
    async synthesizeScholarshipData(evidence, query, locale, depth = 'standard') {
        try {
            logger_1.logger.info('🤖 Scholarship Synthesis - Starting specialized synthesis', {
                query,
                chunksCount: evidence.chunks?.length || 0,
                sourcesCount: evidence.sources?.length || 0
            });
            const evidenceText = evidence.chunks?.map((chunk, index) => `CHUNK ${index + 1}:\nURL: ${chunk.url}\nTITLE: ${chunk.title}\nCONTENT: ${chunk.text}\n`).join('\n---\n') || '';
            const systemPrompt = `You are an expert scholarship analyst. Extract scholarship opportunities from the provided evidence and return them in the exact JSON format specified. Focus on finding actual scholarship programs, grants, or funding opportunities.`;
            const userPrompt = `Query: ${query}\nLocale: ${locale || 'en'}\nDepth: ${depth}

Analyze this evidence and extract COMPLETE scholarship opportunities. Each chunk contains more context now, so look for complete information:

${evidenceText}

Return ONLY valid JSON matching this exact schema:
{
  "items": [
    {
      "id": "unique_id_1",
      "title": "Complete Scholarship Name",
      "summary": "Detailed description including what the scholarship covers",
      "eligibility": ["Specific requirement 1", "Specific requirement 2", "Academic criteria", "Language requirements"],
      "benefits": ["Tuition coverage details", "Stipend amount", "Travel allowance", "Insurance coverage"],
      "deadlines": ["Application opening date", "Application deadline", "Result announcement date"],
      "application_link": "https://valid-url.com/apply",
      "citations": [
        {
          "url": "https://valid-url.com",
          "title": "Source Title", 
          "snippet": "Relevant snippet from the chunk",
          "confidence": 0.8
        }
      ]
    }
  ],
  "sources": [
    {
      "url": "https://valid-url.com",
      "title": "Source Title", 
      "snippet": "Relevant snippet",
      "confidence": 0.8
    }
  ]
}

CRITICAL INSTRUCTIONS:
- Extract COMPLETE scholarship information from the larger chunks
- Each chunk now has 3000 characters - look for full details
- Combine information across chunks if needed for completeness
- Ensure URLs are valid (start with http:// or https://)
- If a URL is invalid, use "Not specified" instead
- Focus on scholarships with complete information
- Quality over quantity - prefer 3 complete scholarships over 10 incomplete ones`;
            const completion = await this.openai.chat.completions.create({
                model: config_1.config.openai.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 4000,
                response_format: { type: 'json_object' }
            });
            const response = completion.choices[0]?.message?.content || '{}';
            logger_1.logger.info('✅ Scholarship Synthesis - OpenAI response received', {
                query,
                responseLength: response.length,
                responsePreview: response.substring(0, 200) + '...'
            });
            let parsed;
            try {
                parsed = JSON.parse(response);
            }
            catch (parseError) {
                logger_1.logger.error('❌ Scholarship Synthesis - JSON parse failed', {
                    query,
                    response,
                    error: parseError
                });
                return { query, locale, depth, items: [], sources: [], validationErrors: ['Invalid JSON response from AI'] };
            }
            const validation = structured_1.StructuredResponseSchema.safeParse(parsed);
            if (!validation.success) {
                logger_1.logger.warn('⚠️ Scholarship Synthesis - Validation failed, attempting repair', {
                    query,
                    errors: validation.error.errors
                });
                const repaired = this.repairScholarshipResponse(parsed);
                const repairValidation = structured_1.StructuredResponseSchema.safeParse(repaired);
                if (repairValidation.success) {
                    logger_1.logger.info('✅ Scholarship Synthesis - Repair successful', { query });
                    return repairValidation.data;
                }
                else {
                    logger_1.logger.error('❌ Scholarship Synthesis - Repair failed', {
                        query,
                        errors: repairValidation.error.errors
                    });
                    return { query, locale, depth, items: [], sources: [], validationErrors: repairValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) };
                }
            }
            logger_1.logger.info('🎉 Scholarship Synthesis - Successfully completed', {
                query,
                itemsCount: parsed.items?.length || 0,
                sourcesCount: parsed.sources?.length || 0
            });
            return validation.data;
        }
        catch (error) {
            logger_1.logger.error('❌ Scholarship Synthesis - Failed', {
                query,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { query, locale, depth, items: [], sources: [], validationErrors: [`Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
        }
    }
    repairScholarshipResponse(parsed) {
        const repaired = { ...parsed };
        if (!Array.isArray(repaired.items)) {
            repaired.items = [];
        }
        if (!Array.isArray(repaired.sources)) {
            repaired.sources = [];
        }
        if (repaired.items) {
            repaired.items = repaired.items.map((item, index) => {
                let applicationLink = item.application_link || '';
                if (applicationLink && !applicationLink.startsWith('http')) {
                    applicationLink = 'Not specified';
                }
                return {
                    id: item.id || `item_${index + 1}`,
                    title: item.title || 'Unknown Scholarship',
                    summary: item.summary || 'No description available',
                    eligibility: Array.isArray(item.eligibility) ? item.eligibility : [],
                    benefits: Array.isArray(item.benefits) ? item.benefits : [],
                    deadlines: Array.isArray(item.deadlines) ? item.deadlines : [],
                    application_link: applicationLink,
                    citations: Array.isArray(item.citations) ? item.citations.map((citation) => ({
                        url: citation.url && citation.url.startsWith('http') ? citation.url : 'Not specified',
                        title: citation.title || 'Untitled',
                        snippet: citation.snippet || '',
                        confidence: citation.confidence || 0.5
                    })) : []
                };
            });
        }
        return repaired;
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