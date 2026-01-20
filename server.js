const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const connectedDB = require('./Config/db');
const authRoutes = require('./Routes/AuthRouters');
const todoRoutes = require('./Routes/TodoRouters');
const { verifyToken } = require('./middleware/authenticate');

// Connect to database (non-blocking)
connectedDB().catch(err => {
    console.error('Failed to connect to database:', err.message);
    console.error('Server will start but database operations will fail until connection is established.');
});

app.use(express.json());

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for development (you can restrict this in production)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Request logging middleware (for debugging) - placed after body parser
app.use((req, res, next) => {
  console.log(`\n📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '***';
    console.log('Request Body:', JSON.stringify(bodyCopy, null, 2));
  }
  next();
});
app.use('/auth', authRoutes);
app.use('/api', todoRoutes);

app.get('/', (req, res) => {
    res.send({
        'data': 'server was running'
    });
});

// Test endpoint to verify requests are reaching the server
app.post('/test', (req, res) => {
    console.log('\n🧪 TEST ENDPOINT HIT');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    res.json({
        success: true,
        message: 'Test endpoint is working',
        received: {
            body: req.body,
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString()
        }
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to 0.0.0.0 for Render.com and other cloud platforms

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    if (HOST === '0.0.0.0') {
        console.log(`Server is accessible on all network interfaces`);
    }
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else if (err.code === 'EPERM') {
        console.error(`Permission denied to bind to port ${PORT}. Try using a different port or running with appropriate permissions.`);
    } else {
        console.error('Server error:', err.message);
    }
    process.exit(1);
});

