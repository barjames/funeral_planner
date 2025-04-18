const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
    // Title of the music piece (e.g., "Ave Maria (Schubert)")
    title: {
        type: String,
        required: true,
        trim: true
    },
    // Link to the music (e.g., YouTube URL for the embedded player)
    link: {
        type: String,
        required: true,
        trim: true
    },
    // Optional: Add a field for suggested placement? (e.g., Entrance, Communion)
    // suggestedPlacement: { type: String, trim: true }
}, {
    timestamps: true
});

// Create and export the Mongoose model for 'Music'
module.exports = mongoose.model('Music', MusicSchema);