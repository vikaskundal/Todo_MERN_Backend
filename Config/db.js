/*Connect the mongoDB */
const mongoose = require('mongoose');
require('dotenv').config();

const connectedDB = async () => {
    try {
        if (!process.env.mongoDB_URL) {
            const errorMsg = 'ERROR: mongoDB_URL is not defined in environment variables. Please create a .env file with your MongoDB connection string.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        await mongoose.connect(process.env.mongoDB_URL);
        console.log('✓ DB is connected successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });
        
    } catch (error) {
        console.error('Database connection error:', error.message);
        console.error('Please check your .env file and ensure mongoDB_URL is set correctly.');
        throw error;
    }
};

module.exports = connectedDB;