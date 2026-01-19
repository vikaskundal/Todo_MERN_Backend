// Comprehensive Backend Debugging Script
// Run: node debug-backend.js
// This will test all aspects of your backend to identify issues

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

async function testBackend() {
  console.log('🔍 COMPREHENSIVE BACKEND DEBUGGING\n');
  console.log('='.repeat(60));
  
  // Test 1: Environment Variables
  console.log('\n1️⃣ CHECKING ENVIRONMENT VARIABLES');
  console.log('-'.repeat(60));
  const envVars = {
    'mongoDB_URL': process.env.mongoDB_URL ? '✓ Set' : '✗ NOT SET',
    'jwtKey': process.env.jwtKey ? '✓ Set' : '✗ NOT SET',
    'PORT': process.env.PORT || '8000 (default)',
    'HOST': process.env.HOST || '0.0.0.0 (default)'
  };
  
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  if (!process.env.mongoDB_URL) {
    console.error('\n❌ CRITICAL: mongoDB_URL is not set!');
    console.error('   Create a .env file with: mongoDB_URL=your_connection_string');
    return;
  }
  
  if (!process.env.jwtKey) {
    console.error('\n❌ CRITICAL: jwtKey is not set!');
    console.error('   Add to .env file: jwtKey=your_secret_key');
    return;
  }
  
  // Test 2: Database Connection
  console.log('\n2️⃣ TESTING DATABASE CONNECTION');
  console.log('-'.repeat(60));
  try {
    await mongoose.connect(process.env.mongoDB_URL);
    console.log('✅ Database connected successfully');
    console.log('   Database name:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    
    // Test 3: Check if User Model works
    console.log('\n3️⃣ TESTING USER MODEL');
    console.log('-'.repeat(60));
    try {
      const userCount = await User.countDocuments();
      console.log(`✅ User model is working`);
      console.log(`   Total users in database: ${userCount}`);
      
      // Check if test user exists
      const testUser = await User.findOne({ email: TEST_EMAIL });
      if (testUser) {
        console.log(`✅ Test user found: ${TEST_EMAIL}`);
        console.log(`   User ID: ${testUser._id}`);
        console.log(`   Username: ${testUser.username}`);
      } else {
        console.log(`⚠️  Test user NOT found: ${TEST_EMAIL}`);
        console.log(`   You may need to create this user first`);
      }
    } catch (error) {
      console.error('❌ User model error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Common issues:');
    console.error('   - Check MongoDB connection string');
    console.error('   - Verify network access in MongoDB Atlas');
    console.error('   - Check if password has special characters (URL encode them)');
    await mongoose.connection.close();
    return;
  }
  
  // Test 4: Test Login Endpoint (if fetch is available)
  console.log('\n4️⃣ TESTING LOGIN ENDPOINT');
  console.log('-'.repeat(60));
  
  if (typeof fetch === 'undefined') {
    console.log('⚠️  fetch is not available (Node.js < 18)');
    console.log('   Install node-fetch: npm install node-fetch');
    console.log('   Or use: node test-login.js');
  } else {
    try {
      // First check if server is running
      console.log(`Testing server at: ${BACKEND_URL}`);
      const healthResponse = await fetch(`${BACKEND_URL}/`);
      
      if (!healthResponse.ok) {
        console.error(`❌ Server returned status: ${healthResponse.status}`);
        return;
      }
      
      const healthData = await healthResponse.json();
      console.log('✅ Server is running:', healthData);
      
      // Now test login
      console.log(`\nTesting login with:`);
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD.substring(0, 3)}***`);
      
      const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      });
      
      const loginData = await loginResponse.json();
      
      console.log(`\nResponse Status: ${loginResponse.status}`);
      console.log('Response Body:', JSON.stringify(loginData, null, 2));
      
      if (loginResponse.ok && loginData.data) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('   Token received (first 50 chars):', loginData.data.substring(0, 50) + '...');
      } else {
        console.log('\n❌ LOGIN FAILED');
        console.log('   Error:', loginData.message);
        
        if (loginResponse.status === 401) {
          console.log('\n💡 Troubleshooting:');
          console.log('   - Check if user exists with this email');
          console.log('   - Verify password is correct');
          console.log('   - Check if password was hashed correctly during signup');
        } else if (loginResponse.status === 400) {
          console.log('\n💡 Troubleshooting:');
          console.log('   - Check request body format');
          console.log('   - Verify email format is valid');
        } else if (loginResponse.status === 500) {
          console.log('\n💡 Troubleshooting:');
          console.log('   - Check server logs for detailed error');
          console.log('   - Verify database connection');
        }
      }
      
    } catch (error) {
      console.error('❌ Network error:', error.message);
      console.error('\n💡 Troubleshooting:');
      console.error('   - Make sure server is running: npm start');
      console.error('   - Check if BACKEND_URL is correct');
      console.error('   - Verify CORS settings');
    }
  }
  
  // Test 5: Manual Login Test (Direct Database Query)
  console.log('\n5️⃣ MANUAL LOGIN TEST (Direct Database)');
  console.log('-'.repeat(60));
  try {
    const user = await User.findOne({ email: TEST_EMAIL });
    if (user) {
      console.log('✅ User found in database');
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password hash exists: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Password hash length: ${user.password ? user.password.length : 0}`);
      
      // Test password comparison
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(TEST_PASSWORD, user.password);
      console.log(`   Password match: ${isValid ? '✅ YES' : '❌ NO'}`);
      
      if (!isValid) {
        console.log('\n⚠️  Password does not match!');
        console.log('   This means either:');
        console.log('   - The password you\'re testing is wrong');
        console.log('   - The password was not hashed correctly during signup');
      }
    } else {
      console.log(`❌ User not found: ${TEST_EMAIL}`);
      console.log('\n💡 Create a test user first:');
      console.log('   - Use signup endpoint');
      console.log('   - Or create manually in database');
    }
  } catch (error) {
    console.error('❌ Error testing user:', error.message);
  }
  
  // Cleanup
  await mongoose.connection.close();
  console.log('\n' + '='.repeat(60));
  console.log('✅ Debugging complete!');
  console.log('\n💡 If login still fails:');
  console.log('   1. Check server console logs when making login request');
  console.log('   2. Verify request body is being sent correctly from frontend');
  console.log('   3. Check browser Network tab for actual request/response');
  console.log('   4. Verify CORS is configured correctly');
}

// Run the tests
testBackend().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
