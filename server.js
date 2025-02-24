// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const roomRoutes = require('./routes/room');
const { dbconnect, connectContactDB, Contact, Booking, Cart } = require('./dbconnect');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const nodeMailer = require('nodemailer');
// Add this at the top of server.js
const Room = require('./models/room');
// Database Connections
dbconnect().catch(err => {
    console.error('Failed to connect to Room Database:', err);
    process.exit(1);
});

connectContactDB().catch(err => {
    console.error('Failed to connect to Contact Database:', err);
    process.exit(1);
});

app.use(cors({
    origin: [
        'https://ananta-villa-2024.web.app',
        'https://ananta-villa-2024.firebaseapp.com',
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://192.168.0.146:4200'  // Add your local IP
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
    maxAge: 86400 // 24 hours
}));

// Add a pre-flight OPTIONS handler
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve static files from the 'images' directory
app.use('/image', express.static(path.join(__dirname, 'images')));
//configure nodemailer
const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'meetpatel692020@gmail.com',
        // Replace this with an App Password generated from Google Account settings
        pass: 'sjcrtznfwfpykhej'
    }
});

function generateEmailTemplate(bookingDetails) {
    // More robust image URL handling
    let imageUrl;
    if (bookingDetails.image) {
        if (bookingDetails.image.startsWith('http')) {
            imageUrl = bookingDetails.image;
        } else if (bookingDetails.image.startsWith('/')) {
            imageUrl = `${BASE_URL}${bookingDetails.image}`;
        } else {
            imageUrl = `${BASE_URL}/${bookingDetails.image}`;
        }
    } else {
        // Provide a fallback image if none is provided
        imageUrl = `${BASE_URL}/image/default-room.jpg`;
    }
    
    console.log('Generated image URL:', imageUrl); // For debugging
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f37254; color: white; padding: 20px; text-align: center; }
            .booking-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; padding: 20px; background-color: #f5f5f5; }
            .room-image { width: 100%; max-width: 500px; height: auto; margin: 20px 0; display: block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Booking Confirmation - Ananta Villa</h1>
            </div>
            <div class="booking-details">
                <h2>Thank you for your booking!</h2>
                <h3>Booking Details:</h3>
                <ul>
                    <li><strong>Room Name:</strong> ${bookingDetails.roomName}</li>
                    <li><strong>Price:</strong> ₹${bookingDetails.price}</li>
                    <li><strong>Size:</strong> ${bookingDetails.size}</li>
                    <li><strong>Bed:</strong> ${bookingDetails.bedType}</li>
                    <li><strong>Adults:</strong> ${bookingDetails.adults}</li>
                    <li><strong>Children:</strong> ${bookingDetails.children}</li>
                    <li><strong>Check In Date:</strong> ${bookingDetails.checkInDate}</li>
                    <li><strong>Check Out Date:</strong> ${bookingDetails.checkOutDate}</li>
                    <li><strong>Payment ID:</strong> ${bookingDetails.paymentID}</li>
                </ul>
                <img src="${imageUrl}" alt="Room Image" class="room-image">
            </div>
            <div class="footer">
                <p>We look forward to welcoming you!</p>
                <p>Best regards,<br>Ananta Villa Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Update the email sending endpoint to include additional error handling
app.post('/api/send-booking-email', async (req, res) => {
    console.log('Received email request:', req.body);
    
    const { to, subject, bookingDetails } = req.body;
    
    if (!to || !subject || !bookingDetails) {
        return res.status(400).json({ 
            error: 'Missing required fields', 
            received: { to, subject, bookingDetails: !!bookingDetails } 
        });
    }

    // Validate image URL
    if (!bookingDetails.image) {
        console.warn('No image URL provided in booking details');
    }

    const mailOptions = {
        from: 'meetpatel692020@gmail.com',
        to: to,
        subject: subject,
        html: generateEmailTemplate(bookingDetails)
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', to);
        res.status(200).json({ message: 'Email Sent Successfully' });
    } catch (error) {
        console.error('Error Sending Email:', error);
        res.status(500).json({ 
            error: 'Failed To Send Email', 
            details: error.message 
        });
    }
});
// Contact Form Route
app.post('/contact', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.status(201).send(contact);
    } catch (error) {
        console.error('Contact save error:', error);
        res.status(400).send({
            message: 'Error saving contact',
            error: error.message
        });
    }
});
app.get('/contact', async (req, res) => {
    try {
        const contact = await Contact.find();  // Remove 'new'
        res.status(200).send(contact);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
// Use room routes
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is running' });
});

// Login endpoint
app.post('/api/login', cors(), async (req, res) => {
    console.log('Login request received:', req.body);
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ 
            success: false,
            message: 'No credential received'
        });
    }

    try {
        const decoded = jwt.decode(credential);
        console.log("Decoded Token: ", decoded);

        if (!decoded || !decoded.email) {
            throw new Error('Invalid token format');
        }

        let photoUrl = null;
        if (decoded.picture) {
            try {
                const response = await axios.get(decoded.picture, { 
                    responseType: 'arraybuffer',
                    headers: { 'Accept': 'image/*' },
                    timeout: 5000
                });

                const contentType = response.headers['content-type'];
                const base64Image = Buffer.from(response.data).toString('base64');
                photoUrl = `data:${contentType};base64,${base64Image}`;
            } catch (imageError) {
                console.warn("Failed to fetch profile image:", imageError.message);
                photoUrl = `${req.protocol}://${req.get('host')}/image/default-avatar.png`;
            }
        }

        const user = {
            name: decoded.name || 'User',
            email: decoded.email,
            photo: photoUrl,
            verified: decoded.email_verified || false
        };

        res.status(200).json({ 
            success: true,
            message: 'Login successful', 
            user: user 
        });
    } catch (error) {
        console.error("Authentication Error: ", error);
        res.status(500).json({ 
            success: false,
            message: 'Authentication failed', 
            error: error.message
        });
    }
}); 
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});
// Booking Routes
app.post('/api/bookings/book', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        const savedBooking = await booking.save();
        res.status(201).json({
            success: true,
            data: savedBooking,
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

// Get all bookings
// Add this route as an alias to the existing /api/bookings/book endpoint
app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData= {
            ...req.body,
            roomDetails:{
                ...req.body.roomDetails,
                image:req.body.roomDetails.image
            }
        };
        const booking = new Booking(req.body);
        const savedBooking = await booking.save();
        res.status(201).json({
            success: true,
            data: savedBooking,
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});
app.get('/api/bookings', async (req, res) => {
    try{
        console.log('Fetching Bookings....!');
        const bookings = await Booking.find();
        res.status(200).json(bookings);
    }catch(error){
        console.log(error);
        res.status(500).json(error);
    }
});
// Cart Routes
app.post('/api/cart/add', async (req, res) => {
    try {
        const cartItem = new Cart(req.body);
        const savedCartItem = await cartItem.save();
        res.status(201).json({
            success: true,
            data: savedCartItem,
            message: 'Item added to cart successfully'
        });
    } catch (error) {
        console.error('Cart error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        });
    }
});

app.get('/api/cart/:email', async (req, res) => {
    try {
        const cartItems = await Cart.find({ email: req.params.email })
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: cartItems,
            message: 'Cart items retrieved successfully'
        });
    } catch (error) {
        console.error('Cart retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cart items',
            error: error.message
        });
    }
});

app.delete('/api/cart/remove/:id', async (req, res) => {
    try {
        const result = await Cart.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Cart item removed successfully'
        });
    } catch (error) {
        console.error('Cart deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove cart item',
            error: error.message
        });
    }
});

// Maintain backward compatibility for /rooms endpoint
app.get('/rooms', async (req, res) => {
    try {
        console.log('Fetching rooms...');
        const rooms = await Room.find();
        console.log('Rooms found:', rooms);
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('Press CTRL+C to stop the server');
});