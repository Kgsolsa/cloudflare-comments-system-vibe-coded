// Blog Comment System JavaScript
// Handles form submission, comment display, and real-time updates

// Configuration
const CONFIG = {
    // Update this to your Cloudflare Worker URL
    API_BASE: window.location.origin,
    // Current page URL - this automatically detects the page the comment is on
    PAGE_URL: window.location.href,
    // Character limits (should match backend validation)
    MAX_NAME_LENGTH: 100,
    MAX_COMMENT_LENGTH: 1000
};

// DOM Elements
const elements = {
    form: document.getElementById('comment-form'),
    authorName: document.getElementById('author-name'),
    commentContent: document.getElementById('comment-content'),
    submitBtn: document.getElementById('submit-btn'),
    btnText: document.querySelector('.btn-text'),
    btnLoading: document.querySelector('.btn-loading'),
    formMessage: document.getElementById('form-message'),
    commentsList: document.getElementById('comments-list'),
    loading: document.getElementById('loading'),
    noComments: document.getElementById('no-comments'),
    commentCount: document.getElementById('comment-count'),
    charCount: document.getElementById('char-count')
};

// Initialize the comment system
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadComments();
    updateCharCount();
});

// Initialize event listeners
function initializeEventListeners() {
    // Form submission
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }

    // Character count
    if (elements.commentContent) {
        elements.commentContent.addEventListener('input', updateCharCount);
    }

    // Auto-focus on name field if empty
    if (elements.authorName && !elements.authorName.value) {
        elements.authorName.focus();
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const authorName = elements.authorName.value.trim();
    const commentContent = elements.commentContent.value.trim();

    // Client-side validation
    const validationError = validateCommentForm(authorName, commentContent);
    if (validationError) {
        showFormMessage(validationError, 'error');
        return;
    }

    // Show loading state
    setFormLoading(true);

    try {
        const response = await fetch(`${CONFIG.API_BASE}/api/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                page_url: CONFIG.PAGE_URL,
                author_name: authorName,
                comment_content: commentContent
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showFormMessage('Comment posted successfully!', 'success');
            clearForm();
            loadComments(); // Reload comments to show the new one
        } else {
            showFormMessage(data.error || 'Failed to post comment. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        showFormMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        setFormLoading(false);
    }
}

// Validate comment form
function validateCommentForm(authorName, commentContent) {
    if (!authorName) {
        return 'Please enter your name.';
    }

    if (authorName.length > CONFIG.MAX_NAME_LENGTH) {
        return `Name must be ${CONFIG.MAX_NAME_LENGTH} characters or less.`;
    }

    if (!commentContent) {
        return 'Please enter a comment.';
    }

    if (commentContent.length > CONFIG.MAX_COMMENT_LENGTH) {
        return `Comment must be ${CONFIG.MAX_COMMENT_LENGTH} characters or less.`;
    }

    return null; // No validation errors
}

// Set form loading state
function setFormLoading(isLoading) {
    if (elements.submitBtn) {
        elements.submitBtn.disabled = isLoading;
    }

    if (elements.btnText) {
        elements.btnText.style.display = isLoading ? 'none' : 'inline';
    }

    if (elements.btnLoading) {
        elements.btnLoading.style.display = isLoading ? 'inline' : 'none';
    }

    // Disable form fields during submission
    if (elements.authorName) {
        elements.authorName.disabled = isLoading;
    }
    if (elements.commentContent) {
        elements.commentContent.disabled = isLoading;
    }
}

// Show form message
function showFormMessage(message, type) {
    if (!elements.formMessage) return;

    elements.formMessage.textContent = message;
    elements.formMessage.className = `form-message ${type}`;
    elements.formMessage.style.display = 'block';

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            hideFormMessage();
        }, 5000);
    }

    // Scroll to message if it's an error
    if (type === 'error') {
        elements.formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Hide form message
function hideFormMessage() {
    if (elements.formMessage) {
        elements.formMessage.style.display = 'none';
    }
}

// Clear form after successful submission
function clearForm() {
    if (elements.form) {
        elements.form.reset();
    }
    updateCharCount();

    // Focus back to name field for next comment
    if (elements.authorName) {
        elements.authorName.focus();
    }
}

// Update character count
function updateCharCount() {
    if (!elements.commentContent || !elements.charCount) return;

    const currentLength = elements.commentContent.value.length;
    elements.charCount.textContent = currentLength;

    // Update color based on remaining characters
    const remaining = CONFIG.MAX_COMMENT_LENGTH - currentLength;
    if (remaining < 50) {
        elements.charCount.style.color = '#dc3545'; // Red
    } else if (remaining < 100) {
        elements.charCount.style.color = '#ffc107'; // Yellow
    } else {
        elements.charCount.style.color = '#6c757d'; // Gray
    }
}

// Load comments for the current page
async function loadComments() {
    if (!elements.loading || !elements.commentsList) return;

    try {
        // Show loading state
        elements.loading.style.display = 'block';
        if (elements.commentsList) elements.commentsList.style.display = 'none';
        if (elements.noComments) elements.noComments.style.display = 'none';

        const encodedPageUrl = encodeURIComponent(CONFIG.PAGE_URL);
        const response = await fetch(`${CONFIG.API_BASE}/api/comments?page_url=${encodedPageUrl}`);

        if (!response.ok) {
            throw new Error('Failed to load comments');
        }

        const data = await response.json();
        displayComments(data.comments || []);

    } catch (error) {
        console.error('Error loading comments:', error);

        // Show error state
        if (elements.loading) {
            elements.loading.innerHTML = `
                <div class="error-message">
                    <p>Unable to load comments.</p>
                    <button onclick="loadComments()" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }
}

// Display comments in the list
function displayComments(comments) {
    if (!elements.loading || !elements.commentsList || !elements.noComments) return;

    // Hide loading state
    elements.loading.style.display = 'none';

    // Update comment count
    if (elements.commentCount) {
        elements.commentCount.textContent = comments.length;
    }

    if (comments.length === 0) {
        // Show no comments message
        if (elements.commentsList) elements.commentsList.style.display = 'none';
        if (elements.noComments) elements.noComments.style.display = 'block';
        return;
    }

    // Show comments
    if (elements.commentsList) elements.commentsList.style.display = 'block';
    if (elements.noComments) elements.noComments.style.display = 'none';

    // Render comments
    elements.commentsList.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');

    // Add animation for new comments (if this is a refresh after posting)
    const newComments = elements.commentsList.querySelectorAll('.comment.new');
    newComments.forEach((comment, index) => {
        setTimeout(() => {
            comment.classList.remove('new');
            comment.classList.add('loaded');
        }, index * 100);
    });
}

// Create HTML for a single comment
function createCommentHTML(comment) {
    const escapedName = escapeHtml(comment.author_name);
    const escapedContent = escapeHtml(comment.comment_content);
    const formattedDate = formatDate(comment.created_at);

    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${escapedName}</span>
                <span class="comment-date" title="${formattedDate}">${formatRelativeTime(comment.created_at)}</span>
            </div>
            <div class="comment-content">
                <p>${escapeHtml(escapedContent)}</p>
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date in a user-friendly way
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return formatDate(dateString);
    }
}

// Make functions available globally for inline event handlers
window.loadComments = loadComments;
window.hideFormMessage = hideFormMessage;

// Auto-refresh comments every 30 seconds (optional - can be disabled for performance)
let autoRefreshInterval;
function startAutoRefresh() {
    // Only auto-refresh on the comment widget page, not on embedded forms
    if (window.location.pathname.includes('/comment-widget')) {
        autoRefreshInterval = setInterval(() => {
            // Don't refresh if user is typing
            if (document.activeElement !== elements.commentContent) {
                loadComments();
            }
        }, 30000); // 30 seconds
    }
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}

// Start auto-refresh when page loads
startAutoRefresh();

// Stop auto-refresh when page is hidden
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
        loadComments(); // Refresh when page becomes visible again
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});