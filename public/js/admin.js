// --- Configuration ---
const API_BASE_URL = '/api/content'; // Base URL for content API endpoints

// --- DOM Elements (Grouped by Section using helper) ---

/**
 * Gets common DOM elements for an admin content section.
 * @param {string} type - The content type key (e.g., 'reading', 'gospel').
 * @returns {object} An object containing references to the form, inputs, and list UL. Returns nulls if elements aren't found.
 */
function getSectionElements(type) {
    const form = document.getElementById(`add-${type}-form`);
    const titleInput = document.getElementById(`${type}-title`);
    // Content and Link inputs might not exist for all types
    const contentInput = document.getElementById(`${type}-content`);
    const linkInput = document.getElementById(`${type}-link`);
    const listUl = document.getElementById(`${type}-list`); // e.g., 'readings-list'

    // Basic check if essential elements exist
    if (!form || !titleInput || !listUl) {
        console.warn(`Essential elements (form, title input, or list) not found for admin section: ${type}`);
        // Depending on strictness, you could return null or just the found elements.
        // Returning found elements allows partial