CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_url TEXT NOT NULL,
    author_name TEXT NOT NULL,
    comment_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'approved'
);

CREATE INDEX IF NOT EXISTS idx_comments_page_url ON comments(page_url);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);