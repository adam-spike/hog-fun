// Hog images data - loaded dynamically from index.json
const HOGS_FOLDER = 'all-the-hogs';

// List of all hog images (loaded dynamically)
let hogs = [];

// Extract display name from filename
function getDisplayName(filename) {
    let name = filename
        .replace(/\.png$/i, '')
        .replace(/\.gif$/i, '')
        .replace(/\.jpg$/i, '')
        .replace(/\.jpeg$/i, '')
        .replace(/\.webp$/i, '');

    // Remove date prefix pattern (YYYYMMDD-HHMMSS-)
    name = name.replace(/^\d{8}-\d{6}-/, '');

    // Remove -transparent suffix
    name = name.replace(/-transparent$/, '');

    // Remove -v2, -v3 etc suffixes for display
    name = name.replace(/-v\d+$/, '');

    return name;
}

// Create a hog card element
function createHogCard(filename) {
    const card = document.createElement('div');
    card.className = 'hog-card';
    card.dataset.filename = filename;

    const displayName = getDisplayName(filename);

    card.innerHTML = `
        <img src="${HOGS_FOLDER}/${filename}" alt="${displayName}" loading="lazy">
        <div class="hog-name">${displayName}</div>
    `;

    // Click to copy
    card.addEventListener('click', () => copyImage(filename));

    return card;
}

// Copy image to clipboard
async function copyImage(filename) {
    const imagePath = `${HOGS_FOLDER}/${filename}`;

    try {
        // Fetch the image
        const response = await fetch(imagePath);
        const blob = await response.blob();

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.write) {
            const item = new ClipboardItem({
                [blob.type]: blob
            });
            await navigator.clipboard.write([item]);
            showToast('Copied to clipboard!');
        } else {
            // Fallback: download the image
            downloadImage(filename);
        }
    } catch (error) {
        console.error('Failed to copy:', error);
        // Fallback: download
        downloadImage(filename);
    }
}

// Download image fallback
function downloadImage(filename) {
    const link = document.createElement('a');
    link.href = `${HOGS_FOLDER}/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded!');
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Filter hogs by search query
function filterHogs(query) {
    const grid = document.getElementById('hog-grid');
    const noResults = document.getElementById('no-results');
    const normalizedQuery = query.toLowerCase().trim();

    grid.innerHTML = '';

    const filtered = hogs.filter(filename => {
        const displayName = getDisplayName(filename).toLowerCase();
        return displayName.includes(normalizedQuery) || filename.toLowerCase().includes(normalizedQuery);
    });

    if (filtered.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        filtered.forEach(filename => {
            grid.appendChild(createHogCard(filename));
        });
    }
}

// Load hogs from index.json
async function loadHogs() {
    try {
        const response = await fetch('index.json');
        const data = await response.json();
        hogs = data.hogs.map(h => h.filename);
        return hogs;
    } catch (error) {
        console.error('Failed to load index.json:', error);
        return [];
    }
}

// Initialize
async function init() {
    const grid = document.getElementById('hog-grid');
    const searchInput = document.getElementById('search');

    // Load hogs from index.json
    await loadHogs();

    // Render all hogs
    hogs.forEach(filename => {
        grid.appendChild(createHogCard(filename));
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        filterHogs(e.target.value);
    });

    // Keyboard shortcut: focus search with /
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            searchInput.blur();
            searchInput.value = '';
            filterHogs('');
        }
    });
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
