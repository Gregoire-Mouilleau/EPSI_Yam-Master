const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    avatar_key TEXT NOT NULL DEFAULT 'avatar_1',
    elo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const userTableColumns = db.prepare("PRAGMA table_info(users)").all();
const hasAvatarKeyColumn = userTableColumns.some((column) => column.name === 'avatar_key');

if (!hasAvatarKeyColumn) {
  db.exec("ALTER TABLE users ADD COLUMN avatar_key TEXT NOT NULL DEFAULT 'avatar_1'");
}

module.exports = db;
