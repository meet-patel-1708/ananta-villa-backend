const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/Room'; // or 'mongodb://localhost:27017/Room'

async function testconnection() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');
        mongoose.connection.close(); // Close the connection after testing
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

testconnection();