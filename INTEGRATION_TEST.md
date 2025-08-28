# 🧪 Integration Test Guide

## 🎯 **Test Objective**
Verify that the ScholarshipRight frontend and backend are properly integrated and working together.

## 🚀 **Prerequisites**
- ✅ Backend server running on port 3001
- ✅ Frontend server running on port 3000
- ✅ Both servers started and accessible

## 📋 **Test Checklist**

### **Phase 1: Backend Health Check**
- [ ] Backend server responds to health check
- [ ] Mock endpoint returns valid data
- [ ] Search endpoint processes queries

### **Phase 2: Frontend Accessibility**
- [ ] Frontend loads without errors
- [ ] Search form is displayed
- [ ] UI components render correctly

### **Phase 3: API Integration**
- [ ] Frontend can communicate with backend
- [ ] Search requests are forwarded correctly
- [ ] Responses are displayed properly

### **Phase 4: End-to-End Functionality**
- [ ] Complete search workflow
- [ ] Results display and navigation
- [ ] Error handling and recovery

## 🧪 **Step-by-Step Testing**

### **Step 1: Verify Backend Health**
```bash
# Test backend health
Invoke-RestMethod -Uri "http://localhost:3001/api/scholarships/health" -Method GET

# Test mock endpoint
Invoke-RestMethod -Uri "http://localhost:3001/api/scholarships/mock?query=test" -Method GET

# Test search endpoint
$body = @{query="MEXT Japan"; limit=3} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/scholarships/search" -Method POST -Body $body -ContentType "application/json"
```

### **Step 2: Verify Frontend Accessibility**
```bash
# Test frontend loading
Invoke-WebRequest -Uri "http://localhost:3000" -Method GET

# Test API route
$body = @{query="test query"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/search" -Method POST -Body $body -ContentType "application/json"
```

### **Step 3: Test Complete Integration**
1. **Open browser** to http://localhost:3000
2. **Enter search query**: "MEXT Japan scholarships for international students"
3. **Click search button** or press Ctrl+Enter
4. **Verify results** are displayed
5. **Click on scholarship** to view details
6. **Test navigation** back to results

## 🔍 **Expected Results**

### **Backend Tests**
- ✅ Health check returns `{"status":"healthy"}`
- ✅ Mock endpoint returns structured scholarship data
- ✅ Search endpoint processes queries and returns AI-generated results

### **Frontend Tests**
- ✅ Page loads without JavaScript errors
- ✅ Search form is functional
- ✅ API calls succeed and return data
- ✅ Results are displayed correctly
- ✅ Navigation between views works

### **Integration Tests**
- ✅ Frontend successfully communicates with backend
- ✅ Search queries are processed end-to-end
- ✅ Response data is properly formatted and displayed
- ✅ Error handling works for various scenarios

## 🚨 **Common Issues & Solutions**

### **Issue 1: Backend Connection Failed**
**Symptoms**: "Backend request failed" error
**Solutions**:
- Verify backend server is running on port 3001
- Check firewall settings
- Verify BACKEND_URL in environment variables

### **Issue 2: CORS Errors**
**Symptoms**: Browser console shows CORS policy errors
**Solutions**:
- Backend CORS is already configured
- Check if backend is accessible from frontend origin

### **Issue 3: API Route Not Found**
**Symptoms**: 404 errors on `/api/search`
**Solutions**:
- Verify Next.js API route is properly created
- Check file structure and naming
- Restart frontend development server

### **Issue 4: Data Not Displaying**
**Symptoms**: Search succeeds but no results shown
**Solutions**:
- Check browser console for JavaScript errors
- Verify response data structure matches frontend expectations
- Check component rendering logic

## 📊 **Performance Benchmarks**

### **Response Times**
- **Backend health check**: < 100ms
- **Mock data**: < 200ms
- **AI search**: 10-20 seconds (expected for AI processing)
- **Frontend rendering**: < 500ms

### **Data Quality**
- **Response format**: 100% compliant with PRD schema
- **Data completeness**: All required fields present
- **Validation**: Zod schema validation passes
- **Error handling**: Graceful degradation

## 🎉 **Success Criteria**

The integration is successful when:
1. ✅ **Backend responds** to all health checks and API calls
2. ✅ **Frontend loads** without errors and displays search interface
3. ✅ **Search functionality** works end-to-end
4. ✅ **Data flows** correctly from backend to frontend
5. ✅ **User experience** is smooth and responsive
6. ✅ **Error handling** works for edge cases
7. ✅ **Performance** meets expected benchmarks

## 🔄 **Continuous Testing**

### **Development Testing**
- Run integration tests after each significant change
- Monitor console logs for errors
- Verify API responses in browser dev tools

### **Production Readiness**
- Test with various query types
- Verify error scenarios
- Performance testing under load
- Cross-browser compatibility

## 📝 **Test Results Template**

```
Integration Test Results
Date: _______________
Tester: _____________

Backend Health: ✅/❌
Frontend Loading: ✅/❌
API Integration: ✅/❌
Search Functionality: ✅/❌
Data Display: ✅/❌
Navigation: ✅/❌
Error Handling: ✅/❌
Performance: ✅/❌

Overall Status: ✅ PASS / ❌ FAIL

Issues Found:
- ________________
- ________________

Notes:
________________
________________
```

## 🚀 **Next Steps After Testing**

1. **Document any issues** found during testing
2. **Fix critical problems** before proceeding
3. **Optimize performance** if needed
4. **Plan production deployment**
5. **Set up monitoring** and logging
6. **Prepare user documentation**

---

**Ready to test?** Start with the backend health checks and work through each phase systematically!
