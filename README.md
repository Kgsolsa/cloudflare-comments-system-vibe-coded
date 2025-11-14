# Blog Comment System

A complete, self-hosted comment system built with Cloudflare Workers and D1 database. Perfect for static blogs, Jekyll sites, Hugo sites, or any website that needs comment functionality without relying on third-party services.

## Features

- ✅ **Comment submission** with real-time display
- ✅ **Admin interface** for comment moderation and deletion
- ✅ **Cloudflare D1 database** for reliable, fast storage
- ✅ **KV-based admin secret management** with web-based setup
- ✅ **Mobile-friendly configuration** - no PC required
- ✅ **CORS-enabled** for integration with any website
- ✅ **Responsive design** that works on all devices
- ✅ **Security features** including XSS protection and input validation
- ✅ **Easy embedding** with simple HTML/JS integration
- ✅ **No external dependencies** - completely self-hosted

## 🆕 Latest Updates: KV-Based Admin Secret Management

### Overview
The comment system now uses Cloudflare KV for secure admin secret storage, providing a mobile-friendly setup experience without requiring PC access or command-line tools.

### Key Improvements

**🌐 Web-Based Setup Interface**
- **Setup URL**: `https://your-worker.workers.dev/setup`
- **Mobile-responsive** design that works perfectly on phones and tablets
- **Secure form validation** with minimum 8-character requirement
- **Current secret verification** for safe secret changes
- **No wrangler CLI required** - complete setup through web browser

**🔐 Enhanced Security**
- **KV storage** in Cloudflare's secure global infrastructure
- **No hardcoded secrets** in the codebase
- **Easy secret rotation** without needing redeployment
- **Fallback support** to environment variables if KV is not configured
- **Global distribution** for fast access from anywhere

**📱 Mobile-Friendly Benefits**
- **Setup from anywhere** - works on any device with web browser
- **Responsive design** with touch-friendly interface
- **Progressive enhancement** - works even with limited connectivity
- **Accessible interface** with proper focus management and screen reader support

### New API Endpoints

**POST /setup**
```json
{
    "currentSecret": "existing-secret (optional)",
    "newSecret": "new-secure-secret (min 8 chars)"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Admin secret updated successfully",
    "adminUrl": "https://your-worker.workers.dev/admin?secret=your-new-secret"
}
```

**GET /setup**
Provides a complete web interface for secret configuration.

### Setup Process

**For New Installations:**
1. Deploy the Worker to Cloudflare
2. Create KV namespace: `wrangler kv:namespace create "SECRETS"`
3. Update `wrangler.toml` with KV namespace ID
4. Visit `https://your-worker.workers.dev/setup`
5. Enter your desired admin secret (min 8 characters)
6. Confirm and submit

**To Change Existing Secret:**
1. Visit `https://your-worker.workers.dev/setup`
2. Enter current admin secret
3. Enter new admin secret (min 8 characters)
4. Confirm new secret
5. Submit the form

### Backward Compatibility

The system maintains full backward compatibility:
- **Environment variables** still work as before
- **Fallback mechanism** automatically uses `ADMIN_SECRET_KEY` if KV is not configured
- **Existing deployments** continue to work without changes
- **Gradual migration** possible - KV can be added later

### Configuration Changes

**Updated wrangler.toml:**
```toml
[[kv_namespaces]]
binding = "SECRETS"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

**Environment Variables (Optional):**
- `ADMIN_SECRET_KEY`: Fallback admin secret (only used if KV is not configured)

### Security Architecture

**Secret Storage Priority:**
1. **First**: Cloudflare KV storage (`ADMIN_SECRET_KEY` key)
2. **Second**: Environment variable `ADMIN_SECRET_KEY`
3. **Third**: Default fallback `blog-admin-2024` (development only)

**Validation Rules:**
- Minimum 8 characters for new secrets
- Current secret verification for changes
- XSS protection on all inputs
- SQL injection prevention with parameterized queries
- CORS protection for API endpoints

### Migration Guide

**From Environment Variables to KV:**
1. Deploy with existing `ADMIN_SECRET_KEY` environment variable
2. Create KV namespace and update `wrangler.toml`
3. Deploy again
4. Visit `/setup` and set the same secret in KV
5. Remove environment variable (optional)
6. Deploy final version

**Benefits of Migration:**
- Easier secret management from mobile devices
- No need for wrangler CLI access
- Global distribution and better performance
- Enhanced security with Cloudflare's infrastructure

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

### 5. Create KV Namespace

```bash
# Create KV namespace for storing admin secrets
wrangler kv:namespace create "SECRETS"
```

Note the KV namespace ID from the output and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SECRETS"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### 6. Set Up Admin Secret (Recommended Method)

Visit your Worker URL and navigate to the setup page:
```
https://blog-comments.your-subdomain.workers.dev/setup
```

This will provide a secure web interface to set your admin secret using KV storage.

### 7. Alternative: Set Environment Variable

```bash
# Set your admin secret key (choose a secure random string)
wrangler secret put ADMIN_SECRET_KEY
```

### 8. Deploy

```bash
# Deploy to Cloudflare Workers
wrangler deploy
```

### 9. Integration

Your comment system is now live! Use these URLs:

- **Worker URL**: `https://blog-comments.your-subdomain.workers.dev`
- **Setup Page**: `https://blog-comments.your-subdomain.workers.dev/setup`
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

- `ADMIN_SECRET_KEY`: Secret key for accessing admin interface (optional, can be set via KV)

### KV Storage (Recommended)

The system uses Cloudflare KV to store the admin secret securely:

- **Benefits**:
  - No need to use wrangler CLI for secret management
  - Secure web-based setup interface
  - Easy secret rotation without redeployment
  - Global distribution for fast access
- **Setup URL**: `https://your-worker.workers.dev/setup`
- **Storage Key**: `ADMIN_SECRET_KEY`

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

### POST /setup

Set or update the admin secret in KV storage.

**Request Body:**
```json
{
    "currentSecret": "current-admin-secret (optional)",
    "newSecret": "your-new-secure-secret"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Admin secret updated successfully",
    "adminUrl": "https://your-worker.workers.dev/admin?secret=your-new-secure-secret"
}
```

### GET /setup

Access the admin setup web interface for secure secret configuration.

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

**Built with ❤️ using Cloudflare Workers and D1**

## 📋 Changelog

### v2.0.0 - KV-Based Admin Secret Management
**Released: November 2024**

#### 🆕 New Features
- **Web-based admin setup interface** at `/setup`
- **Cloudflare KV storage** for admin secrets
- **Mobile-friendly configuration** - no PC required
- **Secure secret rotation** without redeployment
- **Responsive setup interface** with validation

#### 🔧 Technical Changes
- Added KV namespace binding in `wrangler.toml`
- Implemented `getAdminSecret()` and `setAdminSecret()` functions
- Created `/setup` GET/POST endpoints
- Updated admin authentication to use KV storage
- Added comprehensive error handling and validation

#### 📱 Mobile Benefits
- Complete setup possible from mobile browser
- Touch-friendly interface with proper focus management
- Responsive design that works on all screen sizes
- No need for wrangler CLI or command-line tools

#### 🔐 Security Improvements
- No hardcoded secrets in codebase
- Secure KV storage in Cloudflare's global infrastructure
- Minimum 8-character requirement for admin secrets
- Current secret verification for safe changes
- Fallback to environment variables for backward compatibility

#### 🔄 Migration Features
- **Backward compatibility** - existing deployments continue to work
- **Gradual migration** path from environment variables to KV
- **Fallback mechanism** automatically checks KV first, then env vars
- **Zero-downtime** secret rotation capability

#### 📚 Documentation Updates
- Comprehensive setup guide for KV configuration
- Mobile-friendly installation instructions
- Detailed API documentation for new endpoints
- Migration guide from environment variables
- Security architecture documentation

### v1.0.0 - Initial Release
**Released: November 2024**

#### ✅ Core Features
- Complete comment system with CRUD operations
- Cloudflare D1 database integration
- Responsive HTML/CSS/JS frontend
- Admin interface for comment moderation
- Real-time comment submission and display
- CORS support for cross-origin requests
- Security features (XSS protection, input validation)
- Multiple integration methods (iframe, direct HTML)

#### 🛠 Technical Foundation
- Cloudflare Workers runtime
- D1 database with optimized indexes
- RESTful API design
- Modern JavaScript with async/await
- Mobile-responsive CSS with accessibility support
- Comprehensive error handling
- Production-ready configuration

#### 📖 Documentation
- Complete setup and deployment guide
- API documentation with examples
- Integration instructions for various platforms
- Troubleshooting guide
- Performance optimization tips