// Load environment variables from .env file at the very beginning
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Middleware for enabling Cross-Origin Resource Sharing
const path = require('path'); // Node.js module for working with file paths

// Import route handlers
const contentRoutes = require('./routes/content');
const pdfRoutes = require('./routes/pdf');

// --- Express App Setup ---
const app = express();
// Use port from environment variable or default to 3001
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Enable CORS for all origins (adjust for production later if needed)
app.use(cors());
// Parse incoming JSON request bodies (like from POST requests)
app.use(express.json());
// Serve static files (HTML, CSS, client-side JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection ---
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
    console.error('Error: MONGODB_URI environment variable not set.');
    process.exit(1); // Exit the application if DB connection string is missing
}

mongoose.connect(dbURI)
    .then(() => console.log(`MongoDB connected successfully to database.`)) // Add DB name confirmation if available in URI options
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        // Consider exiting if the DB connection fails on startup
        process.exit(1);
    });

// Handle connection events (optional but good practice)
mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});


// --- API Routes ---
// Mount the content-related routes under the '/api/content' path
app.use('/api/content', contentRoutes);
// Mount the PDF-related routes under the '/api/pdf' path
app.use('/api/pdf', pdfRoutes);

// --- Catch-all route (Optional: for Single Page Applications) ---
// If you were using a frontend framework that handles routing (like React Router),
// you might uncomment this to send any non-API request to your index.html file.
// For now, static serving handles our separate HTML files.
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// --- Global Error Handler (Basic Example) ---
// Middleware that catches errors passed via next(error)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err); // Log the full error stack
  res.status(500).json({ message: 'Something went wrong on the server!', error: err.message }); // Send generic error response
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running successfully on http://localhost:${PORT}`);
});