const express = require('express');
const router = express.Router(); // Create an Express router instance

// Import Mongoose models we created earlier
const Reading = require('../models/Reading');
const Gospel = require('../models/Gospel');
const Music = require('../models/Music');
const Prayer = require('../models/Prayer');
const Poem = require('../models/Poem');

// Map string identifiers (used in URL) to Mongoose models
const models = {
    readings: Reading,
    gospels: Gospel,
    music: Music,
    prayers: Prayer,
    poems: Poem,
};

// --- GET /api/content/:type ---
// Fetches all items for a specific content type (e.g., /api/content/readings)
router.get('/:type', async (req, res, next) => { // Added next for error handling
    const type = req.params.type.toLowerCase(); // Ensure type is lowercase
    const Model = models[type];

    if (!Model) {
        // If the type is not valid, return a 404 Not Found error
        return res.status(404).json({ message: `Content type '${type}' not found.` });
    }

    try {
        const items = await Model.find().sort({ createdAt: 1 }); // Fetch all documents, sort by creation date
        res.json(items); // Send the items back as JSON
    } catch (err) {
        console.error(`Error fetching ${type}:`, err);
        // Pass error to the global error handler in server.js
        next(err);
        // Or send specific error: res.status(500).json({ message: `Error fetching ${type}`, error: err.message });
    }
});

// --- POST /api/content/:type ---
// Adds a new item for a specific content type (Admin functionality)
router.post('/:type', async (req, res, next) => {
    const type = req.params.type.toLowerCase();
    const Model = models[type];

    if (!Model) {
        return res.status(404).json({ message: `Content type '${type}' not found.` });
    }

    try {
        // Basic validation - check for required fields based on type
        const { title, content, link } = req.body;
        let newItemData = {};

        if (!title) {
            return res.status(400).json({ message: 'Missing required field: title' });
        }
        newItemData.title = title;

        if (type === 'music') {
            if (!link) {
                return res.status(400).json({ message: 'Missing required field: link' });
            }
            newItemData.link = link;
        } else { // readings, gospels, prayers, poems
            if (!content) {
                return res.status(400).json({ message: 'Missing required field: content' });
            }
            newItemData.content = content;
        }

        // Create a new document using the Model
        const newItem = new Model(newItemData);
        // Save the document to the database
        const savedItem = await newItem.save();
        // Respond with 201 Created status and the saved item
        res.status(201).json(savedItem);
    } catch (err) {
         // Handle potential validation errors from Mongoose
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
        console.error(`Error adding ${type}:`, err);
        next(err); // Pass other errors to global handler
    }
});

// --- DELETE /api/content/:type/:id ---
// Deletes a specific item by its ID (Admin functionality)
router.delete('/:type/:id', async (req, res, next) => {
    const type = req.params.type.toLowerCase();
    const id = req.params.id;
    const Model = models[type];

    if (!Model) {
        return res.status(404).json({ message: `Content type '${type}' not found.` });
    }

    // Validate the ID format before trying to query the database
    if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ message: `Invalid ID format: ${id}` });
    }

    try {
        // Find the item by ID and remove it
        const deletedItem = await Model.findByIdAndDelete(id);

        if (!deletedItem) {
            // If no item was found with that ID, return 404
            return res.status(404).json({ message: `${type} item with ID ${id} not found.` });
        }
        // Respond with success message (or just status 204 No Content)
        res.json({ message: `${type} item deleted successfully`, deletedItemId: id });
    } catch (err) {
        console.error(`Error deleting ${type} with ID ${id}:`, err);
        next(err); // Pass error to global handler
    }
});

module.exports = router; // Export the router to be used in server.js