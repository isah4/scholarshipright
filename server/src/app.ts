import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './utils/config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import scholarshipRoutes from './routes/scholarshipRoutes';

class App {
  public app: express.Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = config.server.port;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.server.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
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
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/scholarships', scholarshipRoutes);
    
    // Root endpoint
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
    
    // API info endpoint
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

  private initializeErrorHandling(): void {
    // 404 handler (must be before error handler)
    this.app.use('*', notFoundHandler);
    
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public listen(): void {
    try {
      // Validate configuration
      validateConfig();
      
      this.app.listen(this.port, () => {
        logger.info(`🚀 Server is running on port ${this.port}`);
        logger.info(`📊 Environment: ${config.server.nodeEnv}`);
        logger.info(`🔗 CORS Origin: ${config.server.corsOrigin}`);
        logger.info(`⚡ Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000 / 60} minutes`);
        
        if (config.server.nodeEnv === 'development') {
          logger.info('🔧 Development mode enabled');
          logger.info('📝 API Documentation available at /api');
        }
      });
      
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new App();
app.listen();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
