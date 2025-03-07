    const mongoose = require('mongoose');

    const roomSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        Name: String,
        Price: String,
        Size: String,
        Image1: String,
        Image2: String,
        Image3: String,
        Image4: String,
        Bed: String
    });
// models/room.js
module.exports = mongoose.model('Room', roomSchema, 'rooms'); // Use lowercase 'rooms' for collection name