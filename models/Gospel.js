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

// Create and export the Mongoose model based on the schema
// Mongoose will automatically look for the plural, lowercased version of 'Reading'
// for the collection name (i.e., 'readings')
module.exports = mongoose.model('Reading', ReadingSchema);