const mongoose = require('mongoose');

const PoemSchema = new mongoose.Schema({
    // Title of the poem (e.g., "Do Not Stand At My Grave And Weep")
    title: {
        type: String,
        required: true,
        trim: true
    },
    // The full text content of the poem
    content: {
        type: String,
        required: true
    },
     // Optional: Add author field if needed
    // author: { type: String, trim: true }
}, {
    timestamps: true
});

// Create and export the Mongoose model for 'Poem'
module.exports = mongoose.model('Poem', PoemSchema);