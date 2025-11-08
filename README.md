# Blog Comment System

A complete, self-hosted comment system built with Cloudflare Workers and D1 database. Perfect for static blogs, Jekyll sites, Hugo sites, or any website that needs comment functionality without relying on third-party services.
Made with ❤️ by Compyle Agent and Kurippusu-kun  feel free to use this  and star this repo 😄 

## Features

- ✅ **Comment submission** with real-time display
- ✅ **Admin interface** for comment moderation and deletion
- ✅ **Cloudflare D1 database** for reliable, fast storage
- ✅ **CORS-enabled** for integration with any website
- ✅ **Responsive design** that works on all devices
- ✅ **Security features** including XSS protection and input validation
- ✅ **Easy embedding** with simple HTML/JS integration
- ✅ **No external dependencies** - completely self-hosted

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- Cloudflare account with Workers and D1 enabled

### 1. Clone and Setup

```bash
git clone <your-repo>
cd cloudflare-workers
npm install
```

### 2. Create D1 Database

```bash
# Create the database
wrangler d1 create blog-comments-db

# Note the database ID from the output
```

### 3. Configure Worker

Edit `wrangler.toml` and replace `your-database-id` with the actual database ID:

```toml
name = "blog-comments"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "blog-comments-db"
database_id = "your-actual-database-id-here"  # Replace this
```

### 4. Run Database Migration

```bash
# Apply the database schema
wrangler d1 execute blog-comments-db --file=schema.sql
```

### 5. Set Environment Variables

```bash
# Set your admin secret key (choose a secure random string)
wrangler secret put ADMIN_SECRET_KEY
```

When prompted, enter a secure secret (e.g., `your-secure-admin-secret-123`).

### 6. Deploy

```bash
# Deploy to Cloudflare Workers
wrangler deploy
```

### 7. Integration

Your comment system is now live! Use these URLs:

- **Worker URL**: `https://blog-comments.your-subdomain.workers.dev`
- **Admin Interface**: `https://blog-comments.your-subdomain.workers.dev/admin?secret=YOUR_ADMIN_SECRET_KEY`

## Integration Guide

### Method 1: Iframe Integration (Easiest)

Add this to any blog page where you want comments:

```html
<iframe
    src="https://blog-comments.your-subdomain.workers.dev/comment-widget?page_url=https://yourblog.com/your-post"
    width="100%"
    height="600"
    frameborder="0"
    style="border: none; max-width: 800px; margin: 0 auto; display: block;">
</iframe>
```

Replace:
- `https://blog-comments.your-subdomain.workers.dev` with your Worker URL
- `https://yourblog.com/your-post` with the actual blog post URL

### Method 2: Direct Integration

For more control, include the assets directly on your pages:

```html
<!-- Add to your blog page's <head> -->
<link rel="stylesheet" href="https://blog-comments.your-subdomain.workers.dev/comment-system.css">

<!-- Add to your blog page's <body> where you want comments -->
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
    <div id="form-message" class="form-message" style="display: none;"></div>
</div>

<div id="comments-container" class="comments-container">
    <h3>Comments (<span id="comment-count">0</span>)</h3>
    <div id="loading" class="loading">Loading comments...</div>
    <div id="comments-list" style="display: none;"></div>
    <div id="no-comments" class="no-comments" style="display: none;">
        <p>No comments yet. Be the first to comment!</p>
    </div>
</div>

<!-- Add at the end of your <body> -->
<script src="https://blog-comments.your-subdomain.workers.dev/comment-system.js"></script>
<script>
    // Configure the comment system
    window.CONFIG = {
        API_BASE: 'https://blog-comments.your-subdomain.workers.dev',
        PAGE_URL: window.location.href
    };
</script>
```

## Configuration

### Environment Variables

- `ADMIN_SECRET_KEY`: Secret key for accessing admin interface (required)

### Customization

#### Styling

The system uses CSS variables that you can override:

```css
:root {
    --primary-color: #3b82f6;
    --error-color: #dc3545;
    --success-color: #28a745;
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

#### JavaScript Configuration

```javascript
// Available configuration options
const CONFIG = {
    API_BASE: 'https://your-worker.workers.dev',  // Your Worker URL
    PAGE_URL: window.location.href,               // Current page URL
    MAX_NAME_LENGTH: 100,                         // Max name length
    MAX_COMMENT_LENGTH: 1000                      // Max comment length
};
```

## API Documentation

### GET /api/comments

Retrieve comments for a specific page.

**Parameters:**
- `page_url` (required): URL of the page to get comments for

**Response:**
```json
{
    "comments": [
        {
            "id": 1,
            "author_name": "John Doe",
            "comment_content": "Great post!",
            "created_at": "2024-01-15T10:30:00Z",
            "page_url": "https://example.com/post"
        }
    ],
    "count": 1
}
```

### POST /api/comments

Create a new comment.

**Request Body:**
```json
{
    "page_url": "https://example.com/post",
    "author_name": "Jane Smith",
    "comment_content": "This is my comment"
}
```

**Response:**
```json
{
    "success": true,
    "comment": {
        "id": 2,
        "author_name": "Jane Smith",
        "comment_content": "This is my comment",
        "created_at": "2024-01-15T11:00:00Z",
        "page_url": "https://example.com/post"
    }
}
```

### DELETE /api/comments/:id

Delete a comment (admin only).

**Parameters:**
- `secret` (required): Your admin secret key

**Response:**
```json
{
    "success": true,
    "message": "Comment deleted successfully"
}
```

## Admin Interface

Access the admin interface at:
```
https://your-worker.workers.dev/admin?secret=YOUR_ADMIN_SECRET_KEY
```

**Features:**
- View all comments across all pages
- Search and filter comments
- Delete unwanted comments
- View comment statistics
- Responsive design for mobile devices

## Security Features

- **Input validation**: All inputs are validated on both client and server
- **XSS protection**: HTML content is properly escaped
- **SQL injection prevention**: Parameterized queries used throughout
- **Admin authentication**: Secret key protects admin operations
- **CORS configuration**: Control which domains can access your API

## File Structure

```
cloudflare-workers/
├── src/
│   └── index.js              # Main Worker script with API endpoints
├── assets/
│   ├── comment-system.js    # Frontend JavaScript functionality
│   ├── comment-system.css   # Responsive styling
│   └── comment-form.html    # HTML form example
├── admin/
│   └── admin.html           # Admin interface for comment management
├── schema.sql                # Database schema
├── wrangler.toml            # Cloudflare Worker configuration
└── README.md                # This file
```

## Database Schema

The system uses a single `comments` table:

```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_url TEXT NOT NULL,
    author_name TEXT NOT NULL,
    comment_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'approved'
);

-- Indexes for performance
CREATE INDEX idx_comments_page_url ON comments(page_url);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

## Development

### Local Development

```bash
# Start local development server
wrangler dev

# In another terminal, test with D1 database
wrangler d1 execute blog-comments-db --local --file=schema.sql
```

### Testing

The system includes built-in error handling and validation. Test these scenarios:

1. **Comment submission**: Verify comments appear immediately
2. **Form validation**: Test empty fields and character limits
3. **Admin deletion**: Verify secret key protection works
4. **CORS functionality**: Test from different domains
5. **Responsive design**: Test on mobile devices

### Deployment

```bash
# Deploy to production
wrangler deploy

# Check logs
wrangler tail

# View metrics
wrangler analytics
```

## Troubleshooting

### Common Issues

**1. Comments not appearing**
- Check browser console for JavaScript errors
- Verify Worker URL is correct in your configuration
- Ensure D1 database is properly set up

**2. Admin interface shows "Unauthorized"**
- Verify `ADMIN_SECRET_KEY` is set correctly
- Check the secret parameter in the URL matches exactly

**3. CORS errors**
- Ensure your Worker allows requests from your domain
- Check that API_BASE URL is correct in configuration

**4. Database errors**
- Run `wrangler d1 execute blog-comments-db --file=schema.sql` to ensure schema is applied
- Verify database binding in `wrangler.toml`

### Debug Mode

Add this to your Worker script for debugging:

```javascript
// Add at the top of your fetch handler
console.log('Request received:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers)
});
```

## Performance Considerations

- **Caching**: Comments are cached by Cloudflare's edge network
- **Database optimization**: Indexes on frequently queried columns
- **Minimal dependencies**: No heavy JavaScript libraries
- **Lazy loading**: Comments load only when needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the Cloudflare Workers documentation
3. Open an issue in the repository

---
