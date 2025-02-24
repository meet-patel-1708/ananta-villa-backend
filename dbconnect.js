const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Room';

// Define schemas
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobileno: Number,
    message: String
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    adults: Number,
    children: Number,
    checkInDate: Date,
    checkOutDate: Date,
    roomDetails: {
        title: String,
        price: Number,
        size: String,
        bed: String,
        image: String
    },
    createdAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
    email: String,
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    details: {
        title: String,
        price: String,
        adults: Number,
        children: Number,
        checkInDate: Date,
        checkOutDate: Date,
        image: String
    },
    createdAt: { type: Date, default: Date.now }
});

// Create models
const Contact = mongoose.model('Contact', contactSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Cart = mongoose.model('Cart', cartSchema);

// Main database connection function
async function dbconnect() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB successfully');
        console.log('Connected to database:', mongoose.connection.name);
        
        // Get database instance
        const db = mongoose.connection.db;
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        return mongoose.connection;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}

// Function to check database connection
async function checkConnection() {
    if (mongoose.connection.readyState !== 1) {
        console.log('Database not connected. Attempting to reconnect...');
        return dbconnect();
    }
    return mongoose.connection;
}

// Export models and connection functions
module.exports = {
    dbconnect,
    checkConnection,
    Contact,
    Booking,
    Cart
};