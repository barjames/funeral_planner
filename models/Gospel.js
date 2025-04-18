const mongoose = require('mongoose');

const GospelSchema = new mongoose.Schema({
    // Title of the gospel reading (e.g., "Gospel: John 14:1-6")
    title: {
        type: String,
        required: true,
        trim: true
    },
    // The full text content of the gospel
    content: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

// Create and export the Mongoose model for 'Gospel'
module.exports = mongoose.model('Gospel', GospelSchema);