# Login Troubleshooting Guide

## 🔍 Step-by-Step Debugging

### Step 1: Verify Backend is Running

**Test Backend Health:**
```bash
curl https://your-backend.onrender.com/
```

**Expected Response:**
```json
{"data":"server was running"}
```

**If this fails:**
- Check Render logs for errors
- Verify service is deployed and running
- Check environment variables are set

---

### Step 2: Test Login Endpoint Directly

**Test Login API:**
```bash
curl -X POST https://your-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected Success Response:**
```json
{"data":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

**Expected Error Responses:**
```json
{"message":"Email and password are required"}  // 400
{"message":"Invalid email format"}              // 400
{"message":"Invalid email or password"}         // 401
{"message":"Unable to login. Try again."}      // 500
```

---

### Step 3: Check Browser Console

Open browser DevTools (F12) → Console tab and look for:

**Common Errors:**
- ❌ `Failed to fetch` → CORS or network issue
- ❌ `404 Not Found` → Wrong API URL
- ❌ `401 Unauthorized` → Wrong credentials or token issue
- ❌ `CORS policy` → CORS configuration issue
- ❌ `Network Error` → Backend not accessible

---

### Step 4: Check Network Tab

1. Open DevTools → Network tab
2. Try to login
3. Look for the login request:
   - **Request URL**: Should be `https://your-backend.onrender.com/auth/login`
   - **Request Method**: `POST`
   - **Status Code**: Should be `200` for success
   - **Request Payload**: Should have `email` and `password`

**Check Request Headers:**
```
Content-Type: application/json
```

**Check Response:**
- If status is 200, check if response has `data` field with token
- If status is 401, check error message
- If status is 500, check backend logs

---

### Step 5: Verify Frontend API Configuration

**Check your frontend API base URL:**

```javascript
// Should be your Render backend URL
const API_BASE_URL = 'https://your-backend.onrender.com';
```

**Common Mistakes:**
- ❌ Still using `http://localhost:8000`
- ❌ Missing `https://`
- ❌ Wrong domain name
- ❌ Trailing slash: `https://your-backend.onrender.com/` (should not have trailing slash)

---

### Step 6: Check Backend Logs in Render

Go to Render → Your Service → Logs and check for:

**✅ Good Signs:**
```
✓ DB is connected successfully
Server is running on http://0.0.0.0:10000
POST /auth/login 200
```

**❌ Error Signs:**
```
ERROR: mongoDB_URL is not defined
Database connection error: ...
login error: ...
MongoServerError: ...
```

---

### Step 7: Verify Database Connection

**Check if database is connected:**

Look in Render logs for:
```
✓ DB is connected successfully
```

**If you see database errors:**
- Check `mongoDB_URL` environment variable in Render
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Test connection string format

---

### Step 8: Test with Postman/Thunder Client

**Use API testing tool to verify backend:**

1. **POST** `https://your-backend.onrender.com/auth/login`
2. **Headers:**
   ```
   Content-Type: application/json
   ```
3. **Body (JSON):**
   ```json
   {
     "email": "your-test-email@example.com",
     "password": "your-password"
   }
   ```

**If this works but frontend doesn't:**
- Issue is in frontend configuration
- Check API URL, CORS, or request format

**If this doesn't work:**
- Issue is in backend
- Check backend logs and database connection

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch" or "Network Error"

**Causes:**
- Backend URL is wrong
- Backend is not running
- CORS issue

**Solutions:**
1. Verify backend URL is correct
2. Check Render service is running
3. Verify CORS is enabled: `app.use(cors())` ✅ (already done)

---

### Issue 2: "404 Not Found"

**Causes:**
- Wrong API endpoint URL
- Missing `/auth` prefix

**Solutions:**
- Ensure URL is: `https://your-backend.onrender.com/auth/login`
- Not: `https://your-backend.onrender.com/login` ❌

---

### Issue 3: "401 Invalid email or password"

**Causes:**
- Wrong email/password
- User doesn't exist
- Password hash mismatch

**Solutions:**
1. Verify user exists in database
2. Try signup first to create account
3. Check if password was hashed correctly during signup

---

### Issue 4: "CORS policy" Error

**Causes:**
- CORS not configured properly
- Frontend domain not allowed

**Solutions:**
- Backend already has `app.use(cors())` ✅
- If still getting errors, check Render logs
- May need to specify frontend origin (optional)

---

### Issue 5: Login Works But Token Not Saved

**Causes:**
- Frontend not handling response correctly
- localStorage not working

**Solutions:**
```javascript
// Check frontend login function
const response = await api.post('/auth/login', { email, password });
// Response should be: { data: "token_string" }
localStorage.setItem('token', response.data.data); // ✅ Correct
// Not: localStorage.setItem('token', response.data); ❌ Wrong
```

---

## 🧪 Quick Test Script

Create this test file to verify everything:

```javascript
// test-login.js
const API_URL = 'https://your-backend.onrender.com';

async function testLogin() {
  try {
    // Test 1: Health check
    console.log('Testing backend health...');
    const health = await fetch(`${API_URL}/`);
    const healthData = await health.json();
    console.log('✅ Backend is running:', healthData);

    // Test 2: Login
    console.log('\nTesting login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Status:', loginResponse.status);
    console.log('Response:', loginData);

    if (loginResponse.ok) {
      console.log('✅ Login successful! Token:', loginData.data);
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
```

Run: `node test-login.js`

---

## ✅ Checklist

- [ ] Backend is running (test `/` endpoint)
- [ ] Database is connected (check Render logs)
- [ ] Frontend API URL points to Render backend
- [ ] Login endpoint works in Postman/Thunder Client
- [ ] Browser console shows no errors
- [ ] Network tab shows correct request/response
- [ ] User exists in database (or try signup first)
- [ ] Environment variables are set in Render

---

## 📞 Need More Help?

Share these details:
1. **Browser Console Error** (screenshot or copy text)
2. **Network Tab** - Request URL and Status Code
3. **Render Logs** - Any error messages
4. **Backend URL** - Your Render backend URL
5. **Frontend URL** - Your frontend URL

This will help identify the exact issue!
