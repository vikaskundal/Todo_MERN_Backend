// Quick test script to verify MongoDB connection string
// Run: node test-connection.js

require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('Connection string:', process.env.mongoDB_URL ? 'Set ✓' : 'NOT SET ✗');

if (!process.env.mongoDB_URL) {
  console.error('❌ ERROR: mongoDB_URL is not set in environment variables');
  process.exit(1);
}

mongoose.connect(process.env.mongoDB_URL)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('✅ Database:', mongoose.connection.name);
    console.log('✅ Ready to deploy to Render!');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', err.message);
    console.error('\nCommon issues:');
    console.error('1. Check username and password are correct');
    console.error('2. Verify Network Access allows 0.0.0.0/0 in MongoDB Atlas');
    console.error('3. Ensure connection string format is correct');
    console.error('4. Check if password has special characters (need URL encoding)');
    process.exit(1);
  });
