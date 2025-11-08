// Blog Comment System - Cloudflare Worker
// Handles GET, POST, and DELETE operations for comments

// CORS middleware
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// Handle OPTIONS requests for CORS
function handleOptions() {
    return new Response(null, {
        headers: corsHeaders()
    });
}

// Validate URL format
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    return input
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Get comments for a specific page
async function getComments(request, env) {
    const url = new URL(request.url);
    const pageUrl = url.searchParams.get('page_url');

    if (!pageUrl) {
        return new Response(
            JSON.stringify({ error: 'page_url parameter is required' }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }

    if (!isValidUrl(pageUrl)) {
        return new Response(
            JSON.stringify({ error: 'Invalid page_url format' }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }

    try {
        const result = await env.DB.prepare(`
            SELECT id, author_name, comment_content, created_at, page_url
            FROM comments
            WHERE page_url = ? AND status = 'approved'
            ORDER BY created_at ASC
        `).bind(pageUrl).all();

        return new Response(
            JSON.stringify({
                comments: result.results || [],
                count: result.results?.length || 0
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    } catch (error) {
        console.error('Database error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to retrieve comments' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }
}

// Create a new comment
async function createComment(request, env) {
    try {
        const body = await request.json();
        const { page_url, author_name, comment_content } = body;

        // Validation
        const errors = [];

        if (!page_url) {
            errors.push('page_url is required');
        } else if (!isValidUrl(page_url)) {
            errors.push('Invalid page_url format');
        }

        if (!author_name) {
            errors.push('author_name is required');
        } else if (typeof author_name !== 'string' || author_name.trim().length === 0) {
            errors.push('author_name cannot be empty');
        } else if (author_name.trim().length > 100) {
            errors.push('author_name must be 100 characters or less');
        }

        if (!comment_content) {
            errors.push('comment_content is required');
        } else if (typeof comment_content !== 'string' || comment_content.trim().length === 0) {
            errors.push('comment_content cannot be empty');
        } else if (comment_content.trim().length > 1000) {
            errors.push('comment_content must be 1000 characters or less');
        }

        if (errors.length > 0) {
            return new Response(
                JSON.stringify({ error: errors.join('; ') }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders()
                    }
                }
            );
        }

        // Sanitize inputs
        const sanitizedPageUrl = sanitizeInput(page_url.trim());
        const sanitizedName = sanitizeInput(author_name.trim());
        const sanitizedContent = sanitizeInput(comment_content.trim());

        // Insert comment
        const result = await env.DB.prepare(`
            INSERT INTO comments (page_url, author_name, comment_content, status)
            VALUES (?, ?, ?, 'approved')
        `).bind(sanitizedPageUrl, sanitizedName, sanitizedContent).run();

        if (!result.success) {
            throw new Error('Failed to insert comment');
        }

        // Retrieve the created comment
        const createdComment = await env.DB.prepare(`
            SELECT id, author_name, comment_content, created_at, page_url
            FROM comments
            WHERE id = ?
        `).bind(result.meta.last_row_id).first();

        return new Response(
            JSON.stringify({
                success: true,
                comment: createdComment
            }),
            {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );

    } catch (error) {
        console.error('Database error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to create comment' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }
}

// Delete a comment (admin only)
async function deleteComment(request, env, commentId) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const adminSecret = env.ADMIN_SECRET_KEY || 'admin-secret-key';

    if (!secret || secret !== adminSecret) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }

    if (!commentId || !/^\d+$/.test(commentId)) {
        return new Response(
            JSON.stringify({ error: 'Invalid comment ID' }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }

    try {
        // Check if comment exists
        const existingComment = await env.DB.prepare(`
            SELECT id FROM comments WHERE id = ?
        `).bind(commentId).first();

        if (!existingComment) {
            return new Response(
                JSON.stringify({ error: 'Comment not found' }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders()
                    }
                }
            );
        }

        // Delete the comment
        const result = await env.DB.prepare(`
            DELETE FROM comments WHERE id = ?
        `).bind(commentId).run();

        if (!result.success) {
            throw new Error('Failed to delete comment');
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Comment deleted successfully'
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );

    } catch (error) {
        console.error('Database error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to delete comment' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }
}

// Get all comments for admin interface
async function getAllComments(request, env) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const adminSecret = env.ADMIN_SECRET_KEY || 'admin-secret-key';

    if (!secret || secret !== adminSecret) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }

    try {
        const result = await env.DB.prepare(`
            SELECT id, author_name, comment_content, created_at, page_url, status
            FROM comments
            ORDER BY created_at DESC
        `).all();

        return new Response(
            JSON.stringify({
                comments: result.results || [],
                count: result.results?.length || 0
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    } catch (error) {
        console.error('Database error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to retrieve comments' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            }
        );
    }
}

// Main request handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return handleOptions();
        }

        // API routes
        if (url.pathname === '/api/comments') {
            switch (request.method) {
                case 'GET':
                    return getComments(request, env);
                case 'POST':
                    return createComment(request, env);
                default:
                    return new Response('Method not allowed', { status: 405 });
            }
        }

        // Admin routes
        if (url.pathname === '/api/comments/all' && request.method === 'GET') {
            return getAllComments(request, env);
        }

        // Delete comment route
        const deleteMatch = url.pathname.match(/^\/api\/comments\/(\d+)$/);
        if (deleteMatch && request.method === 'DELETE') {
            return deleteComment(request, env, deleteMatch[1]);
        }

        // Admin interface route
        if (url.pathname === '/admin' && request.method === 'GET') {
            const secret = url.searchParams.get('secret');
            const adminSecret = env.ADMIN_SECRET_KEY || 'admin-secret-key';

            if (!secret || secret !== adminSecret) {
                return new Response('Unauthorized', { status: 401 });
            }

            // Serve admin interface HTML
            return new Response(getAdminHTML(), {
                headers: {
                    'Content-Type': 'text/html',
                    ...corsHeaders()
                }
            });
        }

        // Comment widget route
        if (url.pathname === '/comment-widget' && request.method === 'GET') {
            return new Response(getCommentWidgetHTML(url.searchParams.get('page_url') || ''), {
                headers: {
                    'Content-Type': 'text/html',
                    ...corsHeaders()
                }
            });
        }

        // Default response
        return new Response('Blog Comment System API', {
            headers: corsHeaders()
        });
    }
};

// Admin interface HTML
function getAdminHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comment Administration</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .admin-comment { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .admin-comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .comment-meta { color: #666; font-size: 0.9em; }
        .comment-content { margin: 10px 0; line-height: 1.4; }
        .delete-btn { background-color: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .delete-btn:hover { background-color: #c82333; }
        .page-url { color: #0066cc; word-break: break-all; }
        .loading { text-align: center; padding: 20px; }
        .error { color: #dc3545; text-align: center; padding: 20px; }
        .success { color: #28a745; text-align: center; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .refresh-btn { background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comment Administration</h1>
        <button class="refresh-btn" onclick="loadComments()">Refresh</button>
    </div>
    <div id="loading" class="loading">Loading comments...</div>
    <div id="error" class="error" style="display: none;"></div>
    <div id="success" class="success" style="display: none;"></div>
    <div id="comments-container"></div>

    <script>
        const API_BASE = window.location.origin;
        const secret = new URLSearchParams(window.location.search).get('secret');

        async function loadComments() {
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const container = document.getElementById('comments-container');

            loading.style.display = 'block';
            error.style.display = 'none';
            container.innerHTML = '';

            try {
                const response = await fetch(\`\${API_BASE}/api/comments/all?secret=\${secret}\`);
                if (!response.ok) {
                    throw new Error('Failed to load comments');
                }

                const data = await response.json();
                displayComments(data.comments);
            } catch (err) {
                error.textContent = 'Error loading comments: ' + err.message;
                error.style.display = 'block';
            } finally {
                loading.style.display = 'none';
            }
        }

        function displayComments(comments) {
            const container = document.getElementById('comments-container');

            if (comments.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No comments found.</p>';
                return;
            }

            container.innerHTML = comments.map(comment => \`
                <div class="admin-comment" data-comment-id="\${comment.id}">
                    <div class="admin-comment-header">
                        <div>
                            <strong>\${escapeHtml(comment.author_name)}</strong>
                            <div class="comment-meta">
                                on <a href="\${escapeHtml(comment.page_url)}" target="_blank" class="page-url">\${escapeHtml(comment.page_url)}</a>
                            </div>
                        </div>
                        <div class="comment-meta">
                            \${formatDate(comment.created_at)}
                        </div>
                    </div>
                    <div class="comment-content">
                        \${escapeHtml(comment.comment_content)}
                    </div>
                    <button class="delete-btn" onclick="deleteComment(\${comment.id})">Delete</button>
                </div>
            \`).join('');
        }

        async function deleteComment(commentId) {
            if (!confirm('Are you sure you want to delete this comment?')) {
                return;
            }

            try {
                const response = await fetch(\`\${API_BASE}/api/comments/\${commentId}?secret=\${secret}\`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete comment');
                }

                // Remove comment from display
                const commentElement = document.querySelector(\`[data-comment-id="\${commentId}"]\`);
                if (commentElement) {
                    commentElement.remove();
                }

                // Show success message
                const success = document.getElementById('success');
                success.textContent = 'Comment deleted successfully';
                success.style.display = 'block';
                setTimeout(() => {
                    success.style.display = 'none';
                }, 3000);

            } catch (err) {
                const error = document.getElementById('error');
                error.textContent = 'Error deleting comment: ' + err.message;
                error.style.display = 'block';
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }

        // Load comments on page load
        loadComments();
    </script>
</body>
</html>
    `;
}

// Comment widget HTML
function getCommentWidgetHTML(pageUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comments</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .comment-form-container { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        textarea { min-height: 100px; resize: vertical; }
        button { background-color: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #0056b3; }
        button:disabled { background-color: #ccc; cursor: not-allowed; }
        .form-message { padding: 10px; margin-top: 10px; border-radius: 4px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .comments-container { margin-top: 30px; }
        .comment { border-bottom: 1px solid #eee; padding: 15px 0; }
        .comment:last-child { border-bottom: none; }
        .comment-header { margin-bottom: 10px; }
        .comment-author { font-weight: bold; color: #333; }
        .comment-date { color: #666; font-size: 0.9em; margin-left: 10px; }
        .comment-content { line-height: 1.5; }
        .no-comments { text-align: center; color: #666; font-style: italic; padding: 20px; }
        .loading { text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div id="comment-form-container" class="comment-form-container">
        <h3>Leave a Comment</h3>
        <form id="comment-form">
            <div class="form-group">
                <label for="author-name">Name:</label>
                <input type="text" id="author-name" name="author_name" required maxlength="100">
            </div>
            <div class="form-group">
                <label for="comment-content">Comment:</label>
                <textarea id="comment-content" name="comment_content" required maxlength="1000" rows="4"></textarea>
            </div>
            <button type="submit" id="submit-btn">Post Comment</button>
        </form>
        <div id="form-message" style="display: none;"></div>
    </div>

    <div id="comments-container" class="comments-container">
        <h3>Comments (<span id="comment-count">0</span>)</h3>
        <div id="loading" class="loading">Loading comments...</div>
        <div id="comments-list" style="display: none;"></div>
        <div id="no-comments" class="no-comments" style="display: none;">
            <p>No comments yet. Be the first to comment!</p>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        const PAGE_URL = \`${pageUrl}\` || window.location.href;

        const form = document.getElementById('comment-form');
        const submitBtn = document.getElementById('submit-btn');
        const formMessage = document.getElementById('form-message');
        const commentsList = document.getElementById('comments-list');
        const loading = document.getElementById('loading');
        const noComments = document.getElementById('no-comments');
        const commentCount = document.getElementById('comment-count');

        // Load comments on page load
        loadComments();

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const authorName = document.getElementById('author-name').value.trim();
            const commentContent = document.getElementById('comment-content').value.trim();

            if (!authorName || !commentContent) {
                showFormMessage('Please fill in all fields.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            try {
                const response = await fetch(\`\${API_BASE}/api/comments\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        page_url: PAGE_URL,
                        author_name: authorName,
                        comment_content: commentContent
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showFormMessage('Comment posted successfully!', 'success');
                    form.reset();
                    loadComments(); // Reload comments
                } else {
                    showFormMessage(data.error || 'Failed to post comment.', 'error');
                }
            } catch (err) {
                showFormMessage('Error posting comment. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post Comment';
            }
        });

        async function loadComments() {
            try {
                const response = await fetch(\`\${API_BASE}/api/comments?page_url=\${encodeURIComponent(PAGE_URL)}\`);

                if (!response.ok) {
                    throw new Error('Failed to load comments');
                }

                const data = await response.json();
                displayComments(data.comments || []);
            } catch (err) {
                console.error('Error loading comments:', err);
                loading.style.display = 'none';
                noComments.style.display = 'block';
                commentCount.textContent = '0';
            }
        }

        function displayComments(comments) {
            loading.style.display = 'none';
            commentCount.textContent = comments.length;

            if (comments.length === 0) {
                commentsList.style.display = 'none';
                noComments.style.display = 'block';
                return;
            }

            commentsList.style.display = 'block';
            noComments.style.display = 'none';

            commentsList.innerHTML = comments.map(comment => \`
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author">\${escapeHtml(comment.author_name)}</span>
                        <span class="comment-date">\${formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-content">
                        \${escapeHtml(comment.comment_content)}
                    </div>
                </div>
            \`).join('');
        }

        function showFormMessage(message, type) {
            formMessage.textContent = message;
            formMessage.className = \`form-message \${type}\`;
            formMessage.style.display = 'block';

            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
    </script>
</body>
</html>
    `;
}
