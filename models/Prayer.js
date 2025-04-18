const mongoose = require('mongoose');

const PrayerSchema = new mongoose.Schema({
    // Title or type of prayer (e.g., "Prayer of the Faithful - Option 1")
    title: {
        type: String,
        required: true,
        trim: true
    },
    // The full text content of the prayer
    content: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

// Create and export the Mongoose model for 'Prayer'
module.exports = mongoose.model('Prayer', PrayerSchema);