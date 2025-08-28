"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.isDevelopment = exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
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
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },
    structured: {
        featureFlag: process.env.STRUCTURED_SEARCH_ENABLED === 'true',
        serpTimeoutMs: parseInt(process.env.SERP_TIMEOUT_MS || '10000', 10),
        serpConcurrency: parseInt(process.env.SERP_CONCURRENCY || '3', 10),
        serpIntervalCap: parseInt(process.env.SERP_INTERVAL_CAP || '6', 10),
        maxPages: parseInt(process.env.MAX_PAGES || '12', 10),
        model: process.env.STRUCTURED_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }
};
function validateConfig() {
    const requiredVars = [
        { key: 'OPENAI_API_KEY', value: exports.config.openai.apiKey, name: 'OpenAI API Key' },
        { key: 'SERPAPI_KEY', value: exports.config.serpapi.apiKey, name: 'SerpAPI Key' }
    ];
    const missingVars = requiredVars.filter(v => !v.value);
    if (missingVars.length > 0) {
        const missingList = missingVars.map(v => v.name).join(', ');
        throw new Error(`Missing required environment variables: ${missingList}`);
    }
}
exports.isDevelopment = exports.config.server.nodeEnv === 'development';
exports.isProduction = exports.config.server.nodeEnv === 'production';
//# sourceMappingURL=config.js.map