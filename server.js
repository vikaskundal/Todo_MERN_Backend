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
app.use(cors());
app.use('/auth', authRoutes);
app.use('/api', todoRoutes);

app.get('/', (req, res) => {
    res.send({
        'data': 'server was running'
    });
});

const PORT = process.env.PORT || 8000;
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

