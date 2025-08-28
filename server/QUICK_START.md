# 🚀 Quick Start Guide

Get your ScholarshipRight server running in 5 minutes!

## ⚡ Quick Setup

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Create Environment File**
```bash
# Copy the example file
cp env.example .env

# Edit .env with your API keys
notepad .env
```

**Required API Keys:**
- `OPENAI_API_KEY`: Get from [OpenAI Platform](https://platform.openai.com/)
- `SERPAPI_KEY`: Get from [SerpAPI](https://serpapi.com/)

### 3. **Start Development Server**
```bash
npm run dev
```

**Or use the batch file:**
```bash
start-dev.bat
```

### 4. **Test the Server**
Open a new terminal and run:
```bash
node test-server.js
```

## 🌐 Server Endpoints

- **Main**: http://localhost:3001
- **API Info**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/scholarships/health
- **Mock Data**: http://localhost:3001/api/scholarships/mock?query=test

## 🧪 Test Without API Keys

If you don't have API keys yet, you can still test with mock data:

```bash
# Test mock endpoint
curl "http://localhost:3001/api/scholarships/mock?query=MEXT"

# Test health check
curl "http://localhost:3001/api/scholarships/health"
```

## 🔧 Troubleshooting

### Server Won't Start?
- Check if port 3001 is available
- Verify `.env` file exists
- Ensure all dependencies are installed

### API Errors?
- Verify API keys in `.env` file
- Check API key validity
- Use mock endpoints for testing

### Build Errors?
- Run `npm run build` to see TypeScript errors
- Check for missing dependencies
- Verify TypeScript configuration

## 📱 Frontend Integration

The server is configured to work with your Next.js frontend:
- CORS enabled for `http://localhost:3000`
- JSON API responses ready
- Error handling compatible

## 🎯 Next Steps

1. ✅ Server is running
2. 🔄 Test endpoints
3. 🔑 Add real API keys
4. 🎨 Integrate with frontend
5. 🚀 Deploy to production

---

**Need Help?** Check the full README.md for detailed documentation!
