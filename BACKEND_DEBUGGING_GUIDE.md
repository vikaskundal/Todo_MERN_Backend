# Backend Debugging Guide

## Problem: Login not working but no errors showing

This guide will help you diagnose why login isn't working even though no errors appear.

## Step 1: Run the Comprehensive Debug Script

Run the debugging script to check all aspects of your backend:

```bash
node debug-backend.js
```

This will test:
- ✅ Environment variables (mongoDB_URL, jwtKey)
- ✅ Database connection
- ✅ User model functionality
- ✅ Login endpoint (if server is running)
- ✅ Direct database password verification

**What to look for:**
- If database connection fails → Check your `.env` file
- If user not found → Create a test user first
- If password doesn't match → Password might not be hashed correctly

## Step 2: Check Server Logs

With the enhanced logging, when you try to login, you should now see detailed logs:

1. **Start your server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

2. **Try logging in from your frontend**

3. **Watch the server console** - You should see:
   ```
   📥 [timestamp] - POST /auth/login
   Request Body: { "email": "...", "password": "***" }
   
   🔐 LOGIN ATTEMPT
   Request received at: [timestamp]
   Request body: { email: "...", password: "***" }
   ✅ Validation passed, searching for user...
   ✅ User found: [email] (ID: [id])
   Comparing password...
   ✅ Password valid, generating token...
   ✅ Login successful! Token generated
   ```

**If you DON'T see these logs:**
- The request is not reaching your backend
- Check frontend URL/endpoint
- Check CORS configuration
- Check if server is actually running

**If you see errors in logs:**
- Database connection error → Check MongoDB connection
- User not found → User doesn't exist
- Password mismatch → Wrong password or password not hashed correctly

## Step 3: Test Login Endpoint Directly

Use the test-login script to test the endpoint directly:

```bash
node test-login.js http://localhost:8000 your-email@example.com your-password
```

Or if your backend is deployed:
```bash
node test-login.js https://your-backend-url.com your-email@example.com your-password
```

## Step 4: Common Issues & Solutions

### Issue 1: No logs appearing when trying to login
**Cause:** Request not reaching backend
**Solutions:**
- Verify backend URL in frontend is correct
- Check if server is running (`npm start`)
- Check CORS settings allow your frontend origin
- Check browser Network tab to see if request is being sent

### Issue 2: "User not found" error
**Cause:** User doesn't exist in database
**Solutions:**
- Create user via signup endpoint first
- Check database directly to verify user exists
- Verify email is correct (case-sensitive)

### Issue 3: "Invalid email or password" but user exists
**Cause:** Password mismatch
**Solutions:**
- Verify password is correct
- Check if password was hashed during signup
- Try resetting password
- Check database - password field should be a long hash string

### Issue 4: Database connection error
**Cause:** MongoDB connection issues
**Solutions:**
- Check `.env` file has `mongoDB_URL` set
- Verify MongoDB Atlas network access allows your IP
- Check connection string format
- Run `node test-connection.js` to test connection

### Issue 5: Token not being returned
**Cause:** JWT key not set or error in token generation
**Solutions:**
- Check `.env` file has `jwtKey` set
- Verify JWT key is not empty
- Check server logs for token generation errors

## Step 5: Frontend Debugging

If backend logs show everything is working, the issue might be in the frontend:

1. **Check browser Network tab:**
   - Open DevTools → Network tab
   - Try logging in
   - Find the login request
   - Check:
     - Request URL (should be `/auth/login`)
     - Request Method (should be POST)
     - Request Payload (should have email and password)
     - Response Status (200 = success, 401 = wrong credentials, 400 = bad request)
     - Response Body (should have `{ data: "token..." }`)

2. **Check frontend code:**
   - Verify API endpoint URL is correct
   - Check if request body is being sent correctly
   - Verify response handling (are you checking `response.data`?)
   - Check if token is being stored correctly

## Quick Checklist

- [ ] Server is running (`npm start`)
- [ ] Database is connected (check server startup logs)
- [ ] `.env` file has `mongoDB_URL` and `jwtKey`
- [ ] User exists in database
- [ ] Password is correct
- [ ] Frontend is sending request to correct URL
- [ ] CORS is configured correctly
- [ ] Check server logs when making login request
- [ ] Check browser Network tab for request/response

## Still Having Issues?

1. Run `node debug-backend.js` and share the output
2. Share server logs when attempting login
3. Share browser Network tab screenshot
4. Verify your frontend login code is correct
