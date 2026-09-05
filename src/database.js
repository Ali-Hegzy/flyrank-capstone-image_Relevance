const db = require('./db/connection');

db.exec(`
    CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        subject TEXT NOT NULL, 
        category TEXT NOT NULL,
        attributes TEXT NOT NULL,
        caption TEXT NOT NULL,
        confidence REAL NOT NULL,
        embedding TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`)
