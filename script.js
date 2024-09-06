const bubbleContainer = document.getElementById('bubble-container');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const searchInput = document.querySelector('.input');
const suggestionsContainer = document.getElementById('suggestions-container');

const websites = [
    { url: 'https://www.google.com', img: 'Materials/google.png', size: 95 },
    { url: 'https://www.youtube.com', img: 'Materials/youtube.png', size: 70 },
    { url: 'https://www.chatgpt.com', img: 'Materials/chatgpt.png', size: 70 },
    { url: 'https://www.pw.live', img: 'Materials/physicswallah.png', size: 70 },
    { url: 'https://www.desmos.com/calculator', img: 'Materials/desmos.png', size: 70 },
    { url: 'https://music.youtube.com/', img: 'Materials/youtubemusic.png', size: 70 },
    { url: 'https://claude.ai/new', img: 'Materials/claude.png', size: 70 },
    { url: 'https://www.vegamovies.tw/', img: 'Materials/vegamovies.png', size: 70 },

];

const bubbles = [];
let isDragging = false;
let draggedBubble = null;
let lastMouseX, lastMouseY;
let mouseVelocityX = 0, mouseVelocityY = 0;
let debounceTimer;
let currentFocus = -1;

// Create bubbles
websites.forEach(site => {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.style.width = `${site.size}px`;
    bubble.style.height = `${site.size}px`;
    
    const img = document.createElement('img');
    img.src = site.img;
    img.alt = site.url;
    bubble.appendChild(img);

    bubbleContainer.appendChild(bubble);
    
    const bubbleObj = {
        element: bubble,
        x: Math.random() * (window.innerWidth - site.size),
        y: Math.random() * (window.innerHeight - site.size),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: site.size,
        url: site.url
    };

    bubbles.push(bubbleObj);

    bubble.addEventListener('mousedown', (e) => {
        if (e.button === 4) { // mouse button
            isDragging = true;
            draggedBubble = bubbleObj;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            e.preventDefault(); // Prevent default right-click behavior
        }
    });
});

// Prevent default context menu
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.bubble')) {
        e.preventDefault();
    }
});

// New mousedown event listener on document
document.addEventListener('mousedown', (e) => {
    if (e.button === 2 && !e.target.closest('.bubble')) {
        isDragging = false;
        draggedBubble = null;
    }
});

// Mouse events for dragging
document.addEventListener('mousemove', (e) => {
    if (isDragging && draggedBubble) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        
        draggedBubble.x += dx;
        draggedBubble.y += dy;

        mouseVelocityX = dx;
        mouseVelocityY = dy;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // Update bubble position immediately
        draggedBubble.element.style.left = `${draggedBubble.x}px`;
        draggedBubble.element.style.top = `${draggedBubble.y}px`;
    }
});

document.addEventListener('mouseup', (e) => {
    if (isDragging && draggedBubble) {
        if (e.button === 2) { // Ensure it's the right mouse button
            // Apply velocity for throwing
            draggedBubble.vx = mouseVelocityX * 0.2;
            draggedBubble.vy = mouseVelocityY * 0.2;
        }
        
        isDragging = false;
        draggedBubble = null;
    }
});


// Bubble animation
function animateBubbles() {
    const searchBarRect = searchInput.getBoundingClientRect();
    const padding = 10; // Extra padding around the search bar

    bubbles.forEach(bubble => {
        if (bubble !== draggedBubble) {
            // Apply velocity
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;

            // Apply a small random movement to prevent getting stuck
            bubble.x += (Math.random() - 0.5) * 0.5;
            bubble.y += (Math.random() - 0.5) * 0.5;

            // Bounce off screen edges
            if (bubble.x <= 0 || bubble.x + bubble.size >= window.innerWidth) {
                bubble.vx *= -1;
                bubble.x = Math.max(0, Math.min(bubble.x, window.innerWidth - bubble.size));
            }
            if (bubble.y <= 0 || bubble.y + bubble.size >= window.innerHeight) {
                bubble.vy *= -1;
                bubble.y = Math.max(0, Math.min(bubble.y, window.innerHeight - bubble.size));
            }

            // Avoid search bar area
            const bubbleRect = {
                left: bubble.x,
                right: bubble.x + bubble.size,
                top: bubble.y,
                bottom: bubble.y + bubble.size
            };

            if (
                bubbleRect.right > searchBarRect.left - padding &&
                bubbleRect.left < searchBarRect.right + padding &&
                bubbleRect.bottom > searchBarRect.top - padding &&
                bubbleRect.top < searchBarRect.bottom + padding
            ) {
                const distLeft = Math.abs(bubbleRect.right - (searchBarRect.left - padding));
                const distRight = Math.abs(bubbleRect.left - (searchBarRect.right + padding));
                const distTop = Math.abs(bubbleRect.bottom - (searchBarRect.top - padding));
                const distBottom = Math.abs(bubbleRect.top - (searchBarRect.bottom + padding));

                const minDist = Math.min(distLeft, distRight, distTop, distBottom);

                if (minDist === distLeft || minDist === distRight) {
                    bubble.vx *= -1;
                } else {
                    bubble.vy *= -1;
                }

                if (minDist === distLeft) {
                    bubble.x = searchBarRect.left - padding - bubble.size;
                } else if (minDist === distRight) {
                    bubble.x = searchBarRect.right + padding;
                } else if (minDist === distTop) {
                    bubble.y = searchBarRect.top - padding - bubble.size;
                } else {
                    bubble.y = searchBarRect.bottom + padding;
                }
            }

            // Bounce off other bubbles
            bubbles.forEach(otherBubble => {
                if (bubble !== otherBubble) {
                    const dx = otherBubble.x - bubble.x;
                    const dy = otherBubble.y - bubble.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < bubble.size) {
                        const angle = Math.atan2(dy, dx);
                        const targetX = bubble.x + Math.cos(angle) * bubble.size;
                        const targetY = bubble.y + Math.sin(angle) * bubble.size;
                        const ax = (targetX - otherBubble.x) * 0.05;
                        const ay = (targetY - otherBubble.y) * 0.05;

                        bubble.vx -= ax;
                        bubble.vy -= ay;
                        otherBubble.vx += ax;
                        otherBubble.vy += ay;

                        bubble.vx += (Math.random() - 0.5) * 0.5;
                        bubble.vy += (Math.random() - 0.5) * 0.5;
                        otherBubble.vx += (Math.random() - 0.5) * 0.5;
                        otherBubble.vy += (Math.random() - 0.5) * 0.5;
                    }
                }
            });

            // Apply friction to prevent excessive speeds
            bubble.vx *= 0.99;
            bubble.vy *= 0.99;

            // Ensure minimum speed to keep bubbles moving
            const minSpeed = 0.1;
            const speed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
            if (speed < minSpeed) {
                bubble.vx = (bubble.vx / speed) * minSpeed;
                bubble.vy = (bubble.vy / speed) * minSpeed;
            }
        }
            bubble.element.style.left = `${bubble.x}px`;
            bubble.element.style.top = `${bubble.y}px`;
        });
    
        requestAnimationFrame(animateBubbles);
    }

    // Add click event for opening websites
    bubbles.forEach(bubbleObj => {
        bubbleObj.element.addEventListener('click', (e) => {
            if (e.button === 0) { // Left mouse button
                window.open(bubbleObj.url, '_blank');
            }
        });
    });
    
    animateBubbles();
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            if (query.length > 0) {
                fetchSuggestions(query);
            } else {
                suggestionsContainer.style.display = 'none';
            }
        }, 300);
    });
    
    searchInput.addEventListener('keydown', function(e) {
        const suggestions = suggestionsContainer.getElementsByClassName('suggestion-item');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(suggestions);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(suggestions);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                if (suggestions) suggestions[currentFocus].click();
            } else {
                const searchQuery = encodeURIComponent(this.value);
                window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
            }
            this.value = '';
            suggestionsContainer.style.display = 'none';
        }
    });
    
    function addActive(suggestions) {
        if (!suggestions) return false;
        removeActive(suggestions);
        if (currentFocus >= suggestions.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (suggestions.length - 1);
        suggestions[currentFocus].classList.add('active');
        searchInput.value = suggestions[currentFocus].textContent;
    }
    
    function removeActive(suggestions) {
        for (let i = 0; i < suggestions.length; i++) {
            suggestions[i].classList.remove('active');
        }
    }
    
    function fetchSuggestions(query) {
        const script = document.createElement('script');
        script.src = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&callback=handleSuggestions`;
        document.body.appendChild(script);
        document.body.removeChild(script);
    }
    
    function handleSuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        currentFocus = -1;
        suggestions[1].forEach((suggestion, index) => {
            const div = document.createElement('div');
            div.classList.add('suggestion-item');
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                searchInput.value = suggestion;
                suggestionsContainer.style.display = 'none';
                const searchQuery = encodeURIComponent(suggestion);
                window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
            });
            div.addEventListener('mouseover', () => {
                removeActive(suggestionsContainer.getElementsByClassName('suggestion-item'));
                div.classList.add('active');
                currentFocus = index;
            });
            suggestionsContainer.appendChild(div);
        });
        suggestionsContainer.style.display = suggestions[1].length > 0 ? 'block' : 'none';
    }
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Dark mode toggle
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
    });
    
    // Set initial mode
    document.body.classList.add('dark-mode');