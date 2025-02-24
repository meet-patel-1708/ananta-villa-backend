// route/room.js
const express = require('express');
const router = express.Router();
const Room = require('../models/room');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const { error, log } = require('console');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const roomName = req.body.Name.toLowerCase().replace(/\s+/g, '-');
        const dir = path.join(__dirname, '../images', roomName);
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const fileNumber = file.fieldname.replace('Image', '');
        cb(null, `${fileNumber}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

const uploadFields = upload.fields([
    { name: 'Image1', maxCount: 1 },
    { name: 'Image2', maxCount: 1 },
    { name: 'Image3', maxCount: 1 },
    { name: 'Image4', maxCount: 1 }
]);

router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find({});
        const baseURL = `${req.protocol}://${req.get('host')}`;
        
        const updatedRooms = rooms.map(room => {
            const cleanRoom = room.toObject();
            ['Image1', 'Image2', 'Image3', 'Image4'].forEach(field => {
                if (cleanRoom[field]) {
                    cleanRoom[field] = `${baseURL}${cleanRoom[field]}`.replace(/([^:]\/)\/+/g, "$1");
                }
            });
            return cleanRoom;
        });
        
        res.json(updatedRooms);
    } catch (error) {
        console.error('Error in /api/rooms:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/', uploadFields, async (req, res) => {
    try {
        const roomName = req.body.Name.toLowerCase().replace(/\s+/g, '-');
        
        const roomData = {
            _id: new mongoose.Types.ObjectId(),
            Name: req.body.Name,
            Price: req.body.Price,
            Size: req.body.Size,
            Bed: req.body.Bed
        };

        if (req.files) {
            ['Image1', 'Image2', 'Image3', 'Image4'].forEach(field => {
                if (req.files[field]) {
                    roomData[field] = `/image/${roomName}/${field.replace('Image', '')}${path.extname(req.files[field][0].originalname)}`;
                }
            });
        }

        const room = new Room(roomData);
        const savedRoom = await room.save();
        
        res.status(201).json({
            success: true,
            data: savedRoom,
            message: 'Room added successfully'
        });
    } catch (error) {
        console.error('Error saving room:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        // Find the room first to get its details
        const room = await Room.findById(req.params.id);
        
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Delete associated images
        const roomName = room.Name.toLowerCase().replace(/\s+/g, '-');
        const imageDir = path.join(__dirname, '../images', roomName);
        
        // Delete the room folder if it exists
        if (fs.existsSync(imageDir)) {
            fs.rmSync(imageDir, { recursive: true, force: true });
        }

        // Delete the room from database
        const result = await Room.findByIdAndDelete(req.params.id); // Changed from findByIdAndUpdate

        if (result) {
            res.json({
                success: true,
                message: 'Room deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
    } catch (err) { // Changed from error to err
        console.log('Error Deleting Room:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting room',
            error: err.message // Changed from error.message to err.message
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        const updates = req.body;
        
        // Find and update the room
        const room = await Room.findByIdAndUpdate(
            roomId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: room,
            message: 'Room updated successfully'
        });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating room',
            error: error.message
        });
    }
});
module.exports = router;