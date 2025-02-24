const express = require('express');
const router = express.Router();
const Booking = require('./booking.model'); // Booking model

// POST route to handle new booking
router.post('/book', async (req, res) => {
  const bookingData = req.body;

  try {
    // Validate and store booking
    const newBooking = new Booking({
      roomId: bookingData.roomId,
      adults: bookingData.adults,
      children: bookingData.children,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      roomDetails: {
        title: bookingData.roomDetails.title,
        price: bookingData.roomDetails.price,
        size: bookingData.roomDetails.size,
        bed: bookingData.roomDetails.bed
      }
    });

    await newBooking.save();
    res.status(201).json({
      message: 'Booking created successfully!',
      booking: newBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

module.exports = router;
