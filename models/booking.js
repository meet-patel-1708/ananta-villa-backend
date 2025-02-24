// booking.model.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  adults: { type: Number, required: true },
  children: { type: Number, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  roomDetails: {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, required: true },
    bed: { type: String, required: true }
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
