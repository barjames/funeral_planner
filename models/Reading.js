const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
    // Title of the reading (e.g., "First Reading: Isaiah 25:6-9")
    title: {
        type: String,
        required: true, // Title is mandatory
        trim: true      // Remove leading/trailing whitespace
    },
    // The full text content of the reading
    content: {
        type: String,
        required: true  // Content is mandatory
    },
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create and export the Mongoose model for 'Reading'
module.exports = mongoose.model('Reading', ReadingSchema);