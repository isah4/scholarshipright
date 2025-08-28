const http = require('http');

// Test configuration
const TEST_PORT = 3001;
const TEST_HOST = 'localhost';

// Test endpoints
const endpoints = [
  { path: '/', method: 'GET', name: 'Root endpoint' },
  { path: '/api', method: 'GET', name: 'API info' },
  { path: '/api/scholarships/health', method: 'GET', name: 'Health check' },
  { path: '/api/scholarships/mock?query=test', method: 'GET', name: 'Mock data' },
  { path: '/api/scholarships/validate?query=test', method: 'GET', name: 'Query validation' }
];

// Test search endpoint
const searchTest = {
  path: '/api/scholarships/search',
  method: 'POST',
  name: 'Search scholarships',
  data: JSON.stringify({ query: 'MEXT Japan', limit: 3 })
};

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: true
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(postData));
      req.write(postData);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing ScholarshipRight Server...\n');
  
  // Test GET endpoints
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const options = {
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: endpoint.path,
        method: endpoint.method
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${endpoint.name}: SUCCESS (${response.statusCode})`);
        if (response.data.success !== undefined) {
          console.log(`   Response: ${response.data.success ? 'Success' : 'Failed'}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: FAILED (${response.statusCode})`);
        if (response.data.message) {
          console.log(`   Error: ${response.data.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
    
    console.log('');
  }
  
  // Test POST endpoint (search)
  try {
    console.log(`Testing ${searchTest.name}...`);
    
    const options = {
      hostname: TEST_HOST,
      port: TEST_PORT,
      path: searchTest.path,
      method: searchTest.method
    };
    
    const response = await makeRequest(options, searchTest.data);
    
    if (response.statusCode === 200) {
      console.log(`✅ ${searchTest.name}: SUCCESS (${response.statusCode})`);
      if (response.data.success !== undefined) {
        console.log(`   Response: ${response.data.success ? 'Success' : 'Failed'}`);
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`   Found ${response.data.data.length} scholarships`);
        }
      }
    } else {
      console.log(`❌ ${searchTest.name}: FAILED (${response.statusCode})`);
      if (response.data.message) {
        console.log(`   Error: ${response.data.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ ${searchTest.name}: ERROR - ${error.message}`);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('\n📝 Note: Some endpoints may fail if API keys are not configured.');
  console.log('   This is expected behavior for development setup.');
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: TEST_HOST,
      port: TEST_PORT,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on port 3001');
    console.log('   Please start the server first with: npm run dev');
    console.log('   Then run this test script again.');
    return;
  }
  
  console.log('✅ Server is running! Starting tests...\n');
  await runTests();
}

main().catch(console.error);
