"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./utils/config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const scholarshipRoutes_1 = __importDefault(require("./routes/scholarshipRoutes"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = config_1.config.server.port;
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: config_1.config.server.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: config_1.config.rateLimit.windowMs,
            max: config_1.config.rateLimit.maxRequests,
            message: {
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests from this IP, please try again later',
                statusCode: 429
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            next();
        });
    }
    initializeRoutes() {
        this.app.use('/api/scholarships', scholarshipRoutes_1.default);
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'ScholarshipRight API Server',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/api/scholarships/health',
                    search: '/api/scholarships/search',
                    mock: '/api/scholarships/mock',
                    validate: '/api/scholarships/validate'
                }
            });
        });
        this.app.get('/api', (req, res) => {
            res.json({
                success: true,
                message: 'ScholarshipRight API',
                version: '1.0.0',
                description: 'AI-powered scholarship search API',
                documentation: 'Coming soon...',
                endpoints: {
                    scholarships: '/api/scholarships'
                }
            });
        });
    }
    initializeErrorHandling() {
        this.app.use('*', errorHandler_1.notFoundHandler);
        this.app.use(errorHandler_1.errorHandler);
    }
    listen() {
        try {
            (0, config_1.validateConfig)();
            this.app.listen(this.port, () => {
                logger_1.logger.info(`🚀 Server is running on port ${this.port}`);
                logger_1.logger.info(`📊 Environment: ${config_1.config.server.nodeEnv}`);
                logger_1.logger.info(`🔗 CORS Origin: ${config_1.config.server.corsOrigin}`);
                logger_1.logger.info(`⚡ Rate Limit: ${config_1.config.rateLimit.maxRequests} requests per ${config_1.config.rateLimit.windowMs / 1000 / 60} minutes`);
                if (config_1.config.server.nodeEnv === 'development') {
                    logger_1.logger.info('🔧 Development mode enabled');
                    logger_1.logger.info('📝 API Documentation available at /api');
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start server', { error });
            process.exit(1);
        }
    }
}
const app = new App();
app.listen();
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=app.js.map