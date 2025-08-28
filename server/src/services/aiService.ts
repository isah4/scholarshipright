import OpenAI from 'openai';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { Scholarship } from '../types/scholarship';
import { ScholarshipSchema } from '../types/validation';

export class AIService {
  private openai: OpenAI;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  async processScholarshipData(rawData: string, query: string): Promise<Scholarship[]> {
    try {
      logger.info('Processing scholarship data with AI', { query, dataLength: rawData.length });
      
      const prompt = this.buildPrompt(query, rawData);
      
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
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
        temperature: 0.1, // Low temperature for consistent output
        max_tokens: 6000, // Increased for better responses
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse and sanitize the JSON response
      let parsedData: any;
      try {
        parsedData = JSON.parse(response);
      } catch (parseError) {
        logger.error('Failed to parse AI response', { response, error: parseError });
        throw new Error('Invalid JSON response from AI service');
      }

      // Validate and normalize the response
      const validatedData = this.validateAndNormalizeData(parsedData);
      
      logger.info('Successfully processed scholarship data', { 
        count: validatedData.length,
        query 
      });

      return validatedData;
    } catch (error) {
      logger.error('AI service error', { error, query });
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(query: string, rawData: string): string {
    // Truncate raw data to prevent token limit issues
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

  private validateAndNormalizeData(data: any): Scholarship[] {
    try {
      // Check if data has the expected structure
      if (!data.scholarships || !Array.isArray(data.scholarships)) {
        throw new Error('Invalid data structure: missing scholarships array');
      }

      const validatedScholarships: Scholarship[] = [];

      for (const scholarship of data.scholarships) {
        try {
          // Sanitize the scholarship data before validation
          const sanitizedScholarship = this.sanitizeScholarshipData(scholarship);
          
          // Validate against schema
          const validated = ScholarshipSchema.parse(sanitizedScholarship);
          validatedScholarships.push(validated);
        } catch (validationError) {
          logger.warn('Scholarship validation failed, attempting to fix', { 
            scholarship: scholarship.title || 'Unknown',
            error: validationError 
          });
          
          // Try to fix common issues and validate again
          try {
            const fixedScholarship = this.fixCommonIssues(scholarship);
            const validated = ScholarshipSchema.parse(fixedScholarship);
            validatedScholarships.push(validated);
            logger.info('Successfully fixed and validated scholarship', { title: scholarship.title });
          } catch (fixError) {
            logger.warn('Failed to fix scholarship, skipping', { 
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
    } catch (error) {
      logger.error('Data validation failed', { error, data });
      throw new Error(`Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private sanitizeScholarshipData(scholarship: any): any {
    // Deep clone to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(scholarship));
    
    // Ensure all required fields exist with defaults
    if (!sanitized.title) sanitized.title = 'Unknown Scholarship';
    if (!sanitized.scholarship_type) sanitized.scholarship_type = 'fully funded';
    if (!sanitized.degree_levels || !Array.isArray(sanitized.degree_levels)) {
      sanitized.degree_levels = ['Masters'];
    }
    if (!sanitized.host_country) sanitized.host_country = 'Not specified';
    if (!sanitized.benefits) sanitized.benefits = {};
    if (!sanitized.requirements) sanitized.requirements = {};
    if (!sanitized.application_timeline) sanitized.application_timeline = {};
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

  private fixCommonIssues(scholarship: any): any {
    const fixed = { ...scholarship };
    
    // Fix common field issues
    if (fixed.benefits) {
      if (!fixed.benefits.tuition) fixed.benefits.tuition = 'Not specified';
      if (!fixed.benefits.stipend) fixed.benefits.stipend = 'Not specified';
      if (!fixed.benefits.travel) fixed.benefits.travel = 'Not specified';
      if (!fixed.benefits.insurance) fixed.benefits.insurance = 'Not specified';
      if (!Array.isArray(fixed.benefits.others)) fixed.benefits.others = [];
    }
    
    if (fixed.requirements) {
      if (!fixed.requirements.academic) fixed.requirements.academic = 'Not specified';
      if (!fixed.requirements.age_limit) fixed.requirements.age_limit = 'Not specified';
      if (!fixed.requirements.language) fixed.requirements.language = 'Not specified';
      if (!Array.isArray(fixed.requirements.others)) fixed.requirements.others = [];
    }
    
    if (fixed.application_timeline) {
      if (!fixed.application_timeline.opening_date) fixed.application_timeline.opening_date = 'Not specified';
      if (!fixed.application_timeline.deadline) fixed.application_timeline.deadline = 'Not specified';
      if (!fixed.application_timeline.result_announcement) fixed.application_timeline.result_announcement = 'Not specified';
    }
    
    if (!fixed.application_link) fixed.application_link = 'https://example.com/not-specified';
    if (!fixed.renewal) fixed.renewal = 'Not specified';
    
    return fixed;
  }

  async generateMockScholarship(query: string): Promise<Scholarship[]> {
    // Fallback mock data for testing when AI service is unavailable
    logger.info('Generating mock scholarship data', { query });
    
    const mockScholarship: Scholarship = {
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
