const mongoose = require('mongoose');

// Room Database Connection URI
const roomMongoURI = 'mongodb://127.0.0.1:27017/Room';

// Contact Database Connection URI
const contactMongoURI = 'mongodb://127.0.0.1:27017/Room';

// Define schemas here to keep everything in one place
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobileno: Number,
    message: String
});

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
        image:String
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

async function dbconnect() {
    try {
        // Connect to Room Database
        await mongoose.connect(roomMongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to Room MongoDB successfully');
        
        // Log the current database
        console.log('Connected to database:', mongoose.connection.name);
        
        // Get direct access to the database
        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Try to query the Room collection directly
        if (collections.some(c => c.name === 'Room')) {
            const roomCollection = db.collection('Room');
            const rooms = await roomCollection.find({}).toArray();
            console.log('Found rooms:', rooms);
        } else {
            console.log('Room collection not found!');
        }
        
    } catch (err) {
        console.error('Room MongoDB connection error:', err);
        throw err;
    }
}

// Separate function for Contact database connection
async function connectContactDB() {
    try {
        // Create a separate connection for Contact database
        const contactConnection = await mongoose.createConnection(contactMongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to Contact MongoDB successfully');
        
        // Register models with this connection
        contactConnection.model('Contact', contactSchema);
        
        return contactConnection;
    } catch (err) {
        console.error('Contact MongoDB connection error:', err);
        throw err;
    }
}

// Export both connection functions and models
module.exports = {
    dbconnect,
    connectContactDB,
    Contact,
    Booking,
    Cart
};