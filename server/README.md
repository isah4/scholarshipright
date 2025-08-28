# ScholarshipRight Server

AI-powered scholarship search server built with Node.js, Express, and OpenAI integration.

## 🚀 Features

- **AI-Powered Search**: Uses OpenAI GPT to process and structure scholarship data
- **Web Search Integration**: SerpAPI integration for finding scholarship information
- **Strict JSON Schema**: Ensures 100% compliance with predefined scholarship data structure
- **Rate Limiting**: Built-in protection against abuse
- **Comprehensive Logging**: Detailed request/response logging
- **Error Handling**: Graceful error handling with meaningful responses
- **Health Monitoring**: Service health checks for all components
- **Mock Data**: Fallback mock data for testing and development

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Express.js     │    │   OpenAI API    │
│   Frontend      │◄──►│   Server         │◄──►│   GPT-4         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   SerpAPI        │
                       │   Web Search     │
                       └──────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- SerpAPI key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd server
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   SERPAPI_KEY=your_serpapi_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Install Playwright browsers** (for web scraping)
   ```bash
   npx playwright install
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## 📚 API Endpoints

### Health Check
```
GET /api/scholarships/health
```
Returns the health status of all services.

### Search Scholarships
```
POST /api/scholarships/search
Content-Type: application/json

{
  "query": "MEXT Japan 2025",
  "limit": 5
}
```

### Mock Data (Testing)
```
GET /api/scholarships/mock?query=test
```
Returns mock scholarship data for testing.

### Query Validation
```
GET /api/scholarships/validate?query=test
```
Validates search query format.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `SERPAPI_KEY` | SerpAPI key | Required |
| `OPENAI_MODEL` | OpenAI model | gpt-4 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 📊 Data Flow

1. **Request**: Client sends search query
2. **Validation**: Request validated using Zod schemas
3. **Web Search**: SerpAPI searches for scholarship information
4. **AI Processing**: OpenAI GPT processes raw data into structured format
5. **Validation**: Response validated against scholarship schema
6. **Response**: Structured JSON returned to client

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3001/api/scholarships/health

# Search scholarships
curl -X POST http://localhost:3001/api/scholarships/search \
  -H "Content-Type: application/json" \
  -d '{"query": "MEXT Japan", "limit": 3}'

# Mock data
curl "http://localhost:3001/api/scholarships/mock?query=test"
```

### Mock Mode
When external services are unavailable, the server can generate mock data for testing and development.

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Request throttling
- **Input Validation**: Zod schema validation
- **Error Sanitization**: No sensitive data in error responses

## 📝 Logging

The server uses structured logging with different levels:
- **ERROR**: Application errors
- **WARN**: Warning conditions
- **INFO**: General information
- **DEBUG**: Debug information

## 🚨 Error Handling

All errors are caught and formatted consistently:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "statusCode": 400
}
```

## 🔄 Development Workflow

1. **Code Changes**: Edit TypeScript files in `src/`
2. **Auto-restart**: Nodemon automatically restarts on file changes
3. **Type Checking**: TypeScript compilation on build
4. **Hot Reload**: Changes reflect immediately in development

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── app.ts           # Main application file
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables
Ensure all required environment variables are set in production.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include logging for debugging
4. Update tests when adding features
5. Follow the existing code structure

## 📄 License

ISC License

## 🆘 Support

For issues and questions:
1. Check the logs for error details
2. Verify API keys are correct
3. Ensure all dependencies are installed
4. Check environment variable configuration

## 🔮 Future Enhancements

- [ ] Database integration for caching
- [ ] Authentication system
- [ ] API rate limiting per user
- [ ] Webhook notifications
- [ ] Advanced search filters
- [ ] Multi-language support
- [ ] Scholarship recommendations
- [ ] Deadline tracking
