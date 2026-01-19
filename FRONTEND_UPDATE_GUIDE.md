# Frontend Update Guide - Using Render Backend URL

## ✅ Yes, You Need to Update the Frontend!

Once you have your Render backend URL (e.g., `https://your-app.onrender.com`), you need to update your frontend to point to it instead of `localhost`.

---

## 🔧 What to Change

### 1. Update API Base URL

Find where you configure your API base URL and change it from:
```javascript
// ❌ OLD (Local Development)
const API_BASE_URL = 'http://localhost:8000';
```

To:
```javascript
// ✅ NEW (Production - Render)
const API_BASE_URL = 'https://your-app.onrender.com';
```

---

## 📍 Where to Make Changes

### Option 1: Using Environment Variables (Recommended)

Create a `.env` file in your frontend root:

**For React/Vite:**
```env
VITE_API_BASE_URL=https://your-app.onrender.com
```

**For React (Create React App):**
```env
REACT_APP_API_BASE_URL=https://your-app.onrender.com
```

**For Next.js:**
```env
NEXT_PUBLIC_API_BASE_URL=https://your-app.onrender.com
```

Then in your API configuration file:
```javascript
// api.js or config.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// or for CRA: process.env.REACT_APP_API_BASE_URL
// or for Next.js: process.env.NEXT_PUBLIC_API_BASE_URL

export default API_BASE_URL;
```

### Option 2: Direct Configuration

Update your axios instance or fetch configuration:

```javascript
// api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-app.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🎯 Complete Example: React Frontend

### Step 1: Create `.env` file

```env
# .env (for local development)
REACT_APP_API_BASE_URL=http://localhost:8000

# .env.production (for production build)
REACT_APP_API_BASE_URL=https://your-app.onrender.com
```

### Step 2: Update API Configuration

```javascript
// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 3: Use in Components

```javascript
// src/services/authService.js
import api from '../config/api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (username, email, password) => {
  const response = await api.post('/auth/signup', { username, email, password });
  return response.data;
};

export const updateUsername = async (newUsername) => {
  const response = await api.put('/auth/update-username', { newUsername });
  return response.data;
};
```

---

## 🌐 For Vercel/Netlify Deployment

### Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key**: `VITE_API_BASE_URL` (or `REACT_APP_API_BASE_URL`)
   - **Value**: `https://your-app.onrender.com`
   - **Environment**: Production, Preview, Development
3. Redeploy your frontend

### Netlify Environment Variables

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-app.onrender.com`
3. Redeploy

---

## 🔒 CORS Configuration

Your backend already has CORS enabled (`app.use(cors())`), so it should work. But if you encounter CORS errors:

**Backend (already done):**
```javascript
app.use(cors()); // Allows all origins
```

**Or restrict to your frontend domain:**
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

---

## ✅ Checklist

- [ ] Update API base URL in frontend configuration
- [ ] Set environment variable in frontend hosting (Vercel/Netlify)
- [ ] Test API calls work with Render backend
- [ ] Verify authentication flow works
- [ ] Test all endpoints (signup, login, todos, etc.)
- [ ] Update `WEBSITE_URL` in Render environment variables to your frontend URL

---

## 🧪 Testing

After updating, test these endpoints:

```javascript
// Test 1: Health check
fetch('https://your-app.onrender.com/')
  .then(res => res.json())
  .then(data => console.log('Backend is running:', data));

// Test 2: Login
fetch('https://your-app.onrender.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
})
  .then(res => res.json())
  .then(data => console.log('Login response:', data));
```

---

## 📝 Example: Complete Frontend API File

```javascript
// src/api/index.js
import axios from 'axios';

// Get API URL from environment or use default
const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  process.env.REACT_APP_API_BASE_URL ||
  'https://your-app.onrender.com';

console.log('API Base URL:', API_BASE_URL); // Debug: Check which URL is being used

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateUsername: (data) => api.put('/auth/update-username', data),
};

// Todo endpoints
export const todoAPI = {
  getTodos: () => api.get('/api/todos'),
  createTodo: (data) => api.post('/api/todos', data),
  updateTodo: (id) => api.put(`/api/todos/${id}`),
  deleteTodo: (id) => api.delete(`/api/todos/${id}`),
  sendTodosToEmail: () => api.post('/api/send-todos'),
};

export default api;
```

---

## 🚨 Common Issues

### Issue: CORS Error
**Solution:** Backend already has `cors()` enabled. If still getting errors, check Render logs.

### Issue: 404 Not Found
**Solution:** Verify the Render URL is correct and includes `https://`

### Issue: Network Error
**Solution:** 
- Check Render service is running
- Verify environment variables are set
- Check Render logs for errors

### Issue: Environment Variable Not Working
**Solution:**
- Restart development server after adding `.env`
- For production, set in hosting platform (Vercel/Netlify)
- Variable names must match framework (VITE_, REACT_APP_, NEXT_PUBLIC_)

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Network tab in DevTools
3. Verify Render backend is running
4. Test backend URL directly: `https://your-app.onrender.com/`

---

**Remember:** After updating, rebuild and redeploy your frontend!
