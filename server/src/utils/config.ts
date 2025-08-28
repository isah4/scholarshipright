import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4'
  },
  
  serpapi: {
    apiKey: process.env.SERPAPI_KEY || ''
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validation function to check required environment variables
export function validateConfig(): void {
  const requiredVars = [
    { key: 'OPENAI_API_KEY', value: config.openai.apiKey, name: 'OpenAI API Key' },
    { key: 'SERPAPI_KEY', value: config.serpapi.apiKey, name: 'SerpAPI Key' }
  ];

  const missingVars = requiredVars.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    const missingList = missingVars.map(v => v.name).join(', ');
    throw new Error(`Missing required environment variables: ${missingList}`);
  }
}

// Check if we're in development mode
export const isDevelopment = config.server.nodeEnv === 'development';
export const isProduction = config.server.nodeEnv === 'production';
