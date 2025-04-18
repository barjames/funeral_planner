// --- Configuration ---
const API_BASE_URL = '/api'; // Relative URL uses the same host/port as the frontend
const MAX_ITEMS_PER_CATEGORY = 2;

// --- DOM Elements (Common - Cache selectors for performance) ---
// Use functions to get elements dynamically if they might not exist on every page
const getElementById = (id) => document.getElementById(id);
const querySelector = (selector) => document.querySelector(selector);
const querySelectorAll = (selector) => document.querySelectorAll(selector);

// --- Wishlist Management (using localStorage) ---
const WISHLIST_KEY = 'funeralWishlist';

/**
 * Retrieves the wishlist from localStorage.
 * @returns {object} The wishlist object (e.g., { readings: [], gospels: [], ... })
 */
function getWishlist() {
    try {
        const wishlistJSON = localStorage.getItem(WISHLIST_KEY);
        const defaultWishlist = { readings: [], gospels: [], music: [], prayers: [], poems: [] };
        // Basic validation in case localStorage contains invalid JSON
        if (!wishlistJSON) return defaultWishlist;
        const parsed = JSON.parse(wishlistJSON);
        // Ensure all categories exist
        return { ...defaultWishlist, ...parsed };
    } catch (error) {
        console.error("Error reading wishlist from localStorage:", error);
        // Return default state in case of error
        return { readings: [], gospels: [], music: [], prayers: [], poems: [] };
    }
}

/**
 * Saves the wishlist to localStorage.
 * @param {object} wishlist - The wishlist object to save.
 */
function saveWishlist(wishlist) {
    try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch (error) {
        console.error("Error saving wishlist to localStorage:", error);
        alert("Could not save your wishlist changes. Your browser's storage might be full or disabled.");
    }
}

/**
 * Adds an item to the wishlist.
 * @param {string} category - The category key (e.g., 'readings', 'music').
 * @param {string} itemId - The MongoDB ObjectId of the item.
 * @param {string} itemTitle - The title of the item for display.
 */
function addToWishlist(category, itemId, itemTitle) {
    const wishlist = getWishlist();
    // Ensure category exists in the wishlist object
    if (!wishlist[category]) {
        console.warn(`Wishlist category '${category}' not initialized. Initializing.`);
        wishlist[category] = []; // Initialize if somehow missing
    }

    // Check if item already exists
    if (wishlist[category].some(item => item.id === itemId)) {
        alert(`"${itemTitle}" is already in your wishlist for ${category}.`);
        return;
    }

    // Check category limit
    if (wishlist[category].length >= MAX_ITEMS_PER_CATEGORY) {
        alert(`You can only add up to ${MAX_ITEMS_PER_CATEGORY} items for the ${category} category.`);
        return;
    }

    wishlist[category].push({ id: itemId, title: itemTitle });
    saveWishlist(wishlist);
    displayWishlist(); // Update the displayed wishlist UI
    updateAddToWishlistButtonStates(category); // Update button states on the current page
}

/**
 * Removes an item from the wishlist.
 * @param {string} category - The category key.
 * @param {string} itemId - The MongoDB ObjectId of the item.
 */
function removeFromWishlist(category, itemId) {
    const wishlist = getWishlist();
    if (!wishlist[category]) {
        return; // Category doesn't exist, nothing to remove
    }
    wishlist[category] = wishlist[category].filter(item => item.id !== itemId);
    saveWishlist(wishlist);
    displayWishlist(); // Update display
    updateAddToWishlistButtonStates(category); // Re-enable relevant add buttons if limit was reached
}

/**
 * Updates the display of the wishlist section on the page.
 */
function displayWishlist() {
    const wishlistContainer = getElementById('wishlist-container');
    // Only proceed if the wishlist container exists on the current page
    if (!wishlistContainer) return;

    const wishlistItemsUl = getElementById('wishlist-items');
    const wishlistSummaryDiv = getElementById('wishlist-summary');
    const generatePdfBtn = getElementById('generate-pdf-btn');

    if (!wishlistItemsUl || !wishlistSummaryDiv || !generatePdfBtn) {
        console.error("Wishlist HTML elements not found. Ensure IDs 'wishlist-items', 'wishlist-summary', and 'generate-pdf-btn' exist.");
        return;
    }

    const wishlist = getWishlist();
    wishlistItemsUl.innerHTML = ''; // Clear previous items
    wishlistSummaryDiv.innerHTML = ''; // Clear summary

    let totalItems = 0;
    let isEmpty = true;

    // Define the order and display names
    const categoryOrder = [
        { key: 'readings', name: 'Readings' },
        { key: 'gospels', name: 'Gospels' },
        { key: 'music', name: 'Music' },
        { key: 'prayers', name: 'Prayers' },
        { key: 'poems', name: 'Poems' },
    ];

    categoryOrder.forEach(catInfo => {
        const categoryKey = catInfo.key;
        const categoryName = catInfo.name;
        const items = wishlist[categoryKey] || []; // Default to empty array if category missing

        // Add summary count paragraph regardless of items present
        const summaryP = document.createElement('p');
        summaryP.innerHTML = `${categoryName}: <span>${items.length} / ${MAX_ITEMS_PER_CATEGORY}</span> selected`;
        wishlistSummaryDiv.appendChild(summaryP);

        if (items.length > 0) {
            isEmpty = false;
            // Add a category heading within the list for clarity
            const categoryLi = document.createElement('li');
            // Avoid adding interactive elements like buttons within the strong tag for accessibility
            categoryLi.innerHTML = `<strong>${categoryName}:</strong>`;
            // Set a class or style directly if needed for styling the category header li
             categoryLi.style.borderBottom = 'none'; // Example: remove border from category headers
             categoryLi.style.marginBottom = '0.2rem';
            wishlistItemsUl.appendChild(categoryLi);

            items.forEach(item => {
                totalItems++;
                const itemLi = document.createElement('li');
                // Use textContent for security unless HTML is intended
                const titleSpan = document.createElement('span');
                titleSpan.textContent = item.title;

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.classList.add('delete-button');
                // Use addEventListener for cleaner separation and management
                removeButton.addEventListener('click', () => removeFromWishlist(categoryKey, item.id));

                itemLi.appendChild(titleSpan);
                itemLi.appendChild(removeButton);
                wishlistItemsUl.appendChild(itemLi);
            });
        }
    });


    if (isEmpty) {
        const emptyLi = document.createElement('li');
        emptyLi.textContent = 'Your wishlist is currently empty. Add items from the content pages.';
        wishlistItemsUl.appendChild(emptyLi);
        generatePdfBtn.style.display = 'none'; // Hide PDF button if empty
    } else {
        generatePdfBtn.style.display = 'inline-block'; // Show PDF button if not empty
    }

    // Also update button states on the main item list if it exists on the current page
    const mainItemListUl = getElementById('item-list');
     if (mainItemListUl && mainItemListUl.dataset.categoryType) {
        updateAddToWishlistButtonStates(mainItemListUl.dataset.categoryType);
    }
}

/**
 * Updates the enabled/disabled state and text of "Add to Wishlist" buttons for a category.
 * @param {string} category - The category key.
 */
function updateAddToWishlistButtonStates(category) {
    const mainItemListUl = getElementById('item-list');
    if (!mainItemListUl) return; // Only run if on a content page with the item list

    const wishlist = getWishlist();
    const categoryItems = wishlist[category] || [];
    const isFull = categoryItems.length >= MAX_ITEMS_PER_CATEGORY;
    const itemIsInWishlist = (itemId) => categoryItems.some(item => item.id === itemId);

    // Select only buttons specifically marked for this category within the main list
    const addButtons = mainItemListUl.querySelectorAll(`button.add-button[data-item-category="${category}"]`);

    addButtons.forEach(button => {
        const itemId = button.dataset.itemId;
        if (!itemId) return; // Skip if button doesn't have item ID

        const isInWishlist = itemIsInWishlist(itemId);

        if (isInWishlist) {
            button.disabled = true;
            button.textContent = 'Added';
        } else if (isFull) {
            button.disabled = true;
            button.textContent = 'Limit Reached';
        } else {
            button.disabled = false;
            button.textContent = 'Add to Wishlist';
        }
    });
}


// --- Content Fetching and Display ---

/**
 * Fetches content for a specific category and displays it in the main item list.
 * @param {string} category - The category key (e.g., 'readings').
 */
async function fetchAndDisplayContent(category) {
    const mainItemListUl = getElementById('item-list');
    if (!mainItemListUl) {
        // console.warn(`Element with id 'item-list' not found on this page.`);
        return; // Don't proceed if the list element doesn't exist
    }

    mainItemListUl.innerHTML = `<li>Loading ${category}...</li>`; // Show loading state
    // Store category type on the list element for reference (e.g., by displayWishlist)
    mainItemListUl.dataset.categoryType = category;


    try {
        const response = await fetch(`${API_BASE_URL}/content/${category}`);
        if (!response.ok) {
             // Try to parse error response from backend if possible
            let errorMsg = `Failed to fetch ${category}. Status: ${response.status}`;
             try {
                 const errorData = await response.json();
                 errorMsg = errorData.message || errorMsg;
             } catch (e) { /* Ignore parsing error */ }
            throw new Error(errorMsg);
        }
        const items = await response.json();

        mainItemListUl.innerHTML = ''; // Clear loading/previous state

        if (!Array.isArray(items) || items.length === 0) {
            mainItemListUl.innerHTML = `<li>No ${category} have been added yet.</li>`;
            return;
        }

        items.forEach(item => {
            // Ensure item has an ID, otherwise skip
             if (!item._id) {
                 console.warn("Item received from API is missing an _id:", item);
                 return;
             }
            const li = createItemListItem(item, category);
            mainItemListUl.appendChild(li);
        });

        // After displaying items, update the button states based on current wishlist
        updateAddToWishlistButtonStates(category);

    } catch (error) {
        console.error(`Error fetching or displaying ${category}:`, error);
        mainItemListUl.innerHTML = `<li>Error loading ${category}: ${error.message}. Please try again later.</li>`;
    }
}

/**
 * Creates an HTML list item element for a given content item.
 * @param {object} item - The content item object (from API).
 * @param {string} category - The category key.
 * @returns {HTMLLIElement} The created list item element.
 */
function createItemListItem(item, category) {
    const li = document.createElement('li');

    // Item Content Div
    const itemContentDiv = document.createElement('div');
    itemContentDiv.classList.add('item-content');

    const titleH3 = document.createElement('h3');
    titleH3.textContent = item.title;
    itemContentDiv.appendChild(titleH3);

    if (item.content) {
        // Handle text content with preview
        const fullContentP = document.createElement('p');
        fullContentP.classList.add('full-content');
        // Sanitize or carefully handle content if it allows HTML, otherwise use textContent
        fullContentP.innerHTML = item.content.replace(/\n/g, '<br>'); // Render newlines as breaks

        const previewP = document.createElement('p');
        previewP.classList.add('preview-text');

        // Simple preview logic (e.g., first 200 chars)
        const previewLength = 200;
        let needsPreviewToggle = item.content.length > previewLength;
        previewP.textContent = item.content.substring(0, previewLength) + (needsPreviewToggle ? '...' : '');


        if (needsPreviewToggle) {
            const showMoreLink = document.createElement('a');
            showMoreLink.href = '#';
            showMoreLink.textContent = 'Show More';
            showMoreLink.classList.add('preview-link');
            showMoreLink.addEventListener('click', (e) => togglePreview(e, previewP, fullContentP));
            previewP.appendChild(document.createElement('br')); // Add break before link
            previewP.appendChild(showMoreLink);

            const showLessLink = document.createElement('a');
            showLessLink.href = '#';
            showLessLink.textContent = 'Show Less';
            showLessLink.classList.add('preview-link');
            showLessLink.addEventListener('click', (e) => togglePreview(e, previewP, fullContentP));
            fullContentP.appendChild(document.createElement('br'));
            fullContentP.appendChild(showLessLink);

             itemContentDiv.appendChild(previewP); // Show preview first
             itemContentDiv.appendChild(fullContentP); // Full content hidden initially
        } else {
             itemContentDiv.appendChild(fullContentP); // Show full if short, hide preview logic elements
             fullContentP.style.display = 'block';
        }


    } else if (item.link && category === 'music') {
        // Handle music link - Embed YouTube Player if possible
        const videoId = extractYouTubeVideoId(item.link);
        const musicPlayerDiv = document.createElement('div');
        musicPlayerDiv.classList.add('music-player');
        if (videoId) {
            const iframe = document.createElement('iframe');
            // Set common attributes
            iframe.width = "560"; // Note: CSS might override this
            iframe.height = "315"; // Note: CSS might override this
            iframe.title = "YouTube video player";
            iframe.frameborder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowfullscreen = true;
             // Set src securely
            iframe.src = `https://www.youtube.com/embed/$${videoId}`;
            musicPlayerDiv.appendChild(iframe);
        } else {
            // Fallback for non-YouTube links or invalid URLs
            const fallbackLink = document.createElement('p');
            const linkA = document.createElement('a');
            linkA.href = item.link;
            linkA.textContent = 'Listen (External Link)';
            linkA.target = '_blank'; // Open in new tab
            linkA.rel = 'noopener noreferrer'; // Security best practice
            fallbackLink.appendChild(linkA);
            musicPlayerDiv.appendChild(fallbackLink);
            console.warn(`Could not extract YouTube ID or invalid link provided for ${item.title}: ${item.link}`);
        }
        itemContentDiv.appendChild(musicPlayerDiv);
    } else if (item.link) {
         // Generic link display for other types if link field exists
         const genericLinkP = document.createElement('p');
         const linkA = document.createElement('a');
         linkA.href = item.link;
         linkA.textContent = 'Link';
         linkA.target = '_blank';
         linkA.rel = 'noopener noreferrer';
         genericLinkP.appendChild(linkA);
         itemContentDiv.appendChild(genericLinkP);
    }

    // Item Actions Div
    const itemActionsDiv = document.createElement('div');
    itemActionsDiv.classList.add('item-actions');

    const addButton = document.createElement('button');
    addButton.textContent = 'Add to Wishlist';
    addButton.classList.add('add-button');
    // Store data attributes needed by addToWishlist and updateAddToWishlistButtonStates
    addButton.dataset.itemId = item._id;
    addButton.dataset.itemTitle = item.title;
    addButton.dataset.itemCategory = category;
    addButton.addEventListener('click', () => addToWishlist(category, item._id, item.title));

    itemActionsDiv.appendChild(addButton);

    // Append main divs to list item
    li.appendChild(itemContentDiv);
    li.appendChild(itemActionsDiv);

    return li;
}

/**
 * Toggles the visibility of preview/full content for text items.
 * @param {Event} event - The click event.
 * @param {HTMLElement} previewElement - The paragraph element showing the preview.
 * @param {HTMLElement} fullContentElement - The paragraph element showing the full content.
 */
function togglePreview(event, previewElement, fullContentElement) {
    event.preventDefault(); // Prevent default link behavior (page jump)

    if (fullContentElement.style.display === 'none') {
        // Show full content, hide preview
        previewElement.style.display = 'none';
        fullContentElement.style.display = 'block';
    } else {
        // Show preview, hide full content
        previewElement.style.display = 'block';
        fullContentElement.style.display = 'none';
    }
}


/**
 * Extracts YouTube Video ID from various URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The video ID or null if not found.
 */
function extractYouTubeVideoId(url) {
    if (!url) return null;
    // Regex improvement: handles various youtube/youtu.be URLs and extracts ID
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}


// --- PDF Generation ---

/**
 * Handles the click event for the 'Generate PDF' button. Sends wishlist IDs to backend.
 */
async function handleGeneratePdf() {
    const generatePdfBtn = getElementById('generate-pdf-btn');
    if (!generatePdfBtn || generatePdfBtn.disabled) return; // Exit if button not found or disabled

    const wishlist = getWishlist();

    // Prepare data in the format expected by the backend (only IDs needed per category)
    const wishlistIds = {};
    let totalItems = 0;
    for (const category in wishlist) {
        // Ensure we only send arrays of IDs
        if (Array.isArray(wishlist[category])) {
            wishlistIds[category] = wishlist[category].map(item => item.id).filter(id => id); // Get IDs, filter out any potential nulls/undefined
            totalItems += wishlistIds[category].length;
        }
    }

     if (totalItems === 0) {
        alert("Your wishlist is empty. Please add some items before generating a PDF.");
        return;
     }

    const originalButtonText = generatePdfBtn.textContent;
    generatePdfBtn.textContent = 'Generating...';
    generatePdfBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/pdf/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ wishlist: wishlistIds }), // Send the structured IDs
        });

        if (!response.ok) {
            let errorMsg = `Failed to generate PDF. Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = `Failed to generate PDF: ${errorData.message || response.statusText}`;
            } catch (e) { /* Ignore if response body is not JSON */ }
            throw new Error(errorMsg);
        }

        // Handle the PDF blob response for download
        const blob = await response.blob();
        // Extract filename from Content-Disposition header if possible, otherwise use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'funeral_plan.pdf'; // Default filename
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Use FileSaver.js logic (or create a link) to trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url); // Clean up the object URL after download starts
        a.remove(); // Remove the temporary link

    } catch (error) {
        console.error('Error generating or downloading PDF:', error);
        alert(`Could not generate PDF: ${error.message}`);
    } finally {
        // Restore button state even if download fails
        generatePdfBtn.textContent = originalButtonText;
        generatePdfBtn.disabled = false;
    }
}

// --- Navigation ---

/**
 * Sets the 'active' class on the correct navigation link based on the current URL path.
 */
function setActiveNavLink() {
    const navLinks = querySelectorAll('nav ul li a');
    if (!navLinks || navLinks.length === 0) return; // Exit if no nav links found

    // Get the current page filename (e.g., 'index.html', 'readings.html')
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html'; // Default to index.html if path is just '/'

    navLinks.forEach(link => {
        // Get the filename from the link's href
        const linkHref = link.getAttribute('href');
        const linkPage = linkHref.substring(linkHref.lastIndexOf('/') + 1);

        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// --- Global Event Listeners and Initialization ---

// Use a single DOMContentLoaded listener for setup
document.addEventListener('DOMContentLoaded', () => {
    // Try to display wishlist on page load (it checks if elements exist)
    displayWishlist();

    // Add event listener for PDF generation button if it exists
    const pdfButton = getElementById('generate-pdf-btn');
    if (pdfButton) {
        pdfButton.addEventListener('click', handleGeneratePdf);
    }

    // Set active nav link (defined above)
    setActiveNavLink();

    // Set current year in footer if element exists
    const yearSpan = getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Note: The specific call to `WorkspaceAndDisplayContent('category')`
    // is now expected to be in an inline script on each respective content page (HTML files)
    // This ensures the correct category is loaded only when on that page.
});

// Make functions globally accessible ONLY if they are called via inline `onclick` attributes
// Since we switched to addEventListener, these might not be strictly needed anymore,
// unless there's a reason to call them directly from the console for debugging.
// window.addToWishlist = addToWishlist;
// window.removeFromWishlist = removeFromWishlist;
// window.togglePreview = togglePreview; // Keep if potentially called from dynamic HTML? Better to use listeners.
// window.fetchAndDisplayContent = fetchAndDisplayContent; // Expose if called from inline script
// window.setActiveNavLink = setActiveNavLink; // Expose if called from inline script

// It's generally better to attach listeners within the script rather than using inline onclick=""
// The current code uses addEventListener for buttons created dynamically and for the PDF button.
// The inline scripts in the HTML files call setActiveNavLink and fetchAndDisplayContent.
// We need to ensure those two are available globally if called like that.
window.setActiveNavLink = setActiveNavLink;
window.fetchAndDisplayContent = fetchAndDisplayContent;