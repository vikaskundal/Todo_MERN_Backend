// Test Login Endpoint
// Usage: node test-login.js <backend-url> <email> <password>
// Example: node test-login.js https://your-app.onrender.com test@example.com password123

const API_URL = process.argv[2] || 'https://your-app.onrender.com';
const EMAIL = process.argv[3] || 'test@example.com';
const PASSWORD = process.argv[4] || 'password123';

async function testLogin() {
  console.log('🔍 Testing Login Endpoint\n');
  console.log('Backend URL:', API_URL);
  console.log('Email:', EMAIL);
  console.log('Password:', '***\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing backend health...');
    try {
      const healthResponse = await fetch(`${API_URL}/`);
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running:', healthData);
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      console.error('   Make sure backend URL is correct and service is running');
      return;
    }

    // Test 2: Login endpoint
    console.log('\n2️⃣ Testing login endpoint...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });

    const loginData = await loginResponse.json();
    
    console.log('Status Code:', loginResponse.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));

    if (loginResponse.ok) {
      if (loginData.data && typeof loginData.data === 'string') {
        console.log('\n✅ Login successful!');
        console.log('Token received:', loginData.data.substring(0, 50) + '...');
        console.log('\n✅ Backend is working correctly!');
      } else {
        console.log('\n⚠️ Login returned 200 but token format is unexpected');
        console.log('Expected: { "data": "token_string" }');
      }
    } else {
      console.log('\n❌ Login failed');
      console.log('Error message:', loginData.message);
      
      if (loginResponse.status === 401) {
        console.log('\n💡 Possible issues:');
        console.log('   - Wrong email or password');
        console.log('   - User does not exist (try signup first)');
      } else if (loginResponse.status === 400) {
        console.log('\n💡 Possible issues:');
        console.log('   - Missing email or password');
        console.log('   - Invalid email format');
      } else if (loginResponse.status === 500) {
        console.log('\n💡 Possible issues:');
        console.log('   - Database connection error');
        console.log('   - Check Render logs for details');
      }
    }

  } catch (error) {
    console.error('\n❌ Network Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   - Backend URL is incorrect');
    console.error('   - Backend service is not running');
    console.error('   - CORS issue (check backend CORS configuration)');
    console.error('   - Network connectivity issue');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or install node-fetch');
  console.error('   Run: npm install node-fetch');
  process.exit(1);
}

testLogin();
