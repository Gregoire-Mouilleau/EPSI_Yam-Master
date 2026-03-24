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

// Table pour sauvegardes vs Bot
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_state TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Index pour accès rapide par user_id
db.exec(`CREATE INDEX IF NOT EXISTS idx_saved_games_user_id ON saved_games(user_id)`);

// Table pour historique des parties
db.exec(`
  CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type TEXT NOT NULL CHECK(game_type IN ('online', 'bot')),
    player1_id INTEGER NOT NULL,
    player1_pseudo TEXT NOT NULL,
    player2_id INTEGER,
    player2_pseudo TEXT,
    winner_id INTEGER,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    played_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Index pour accès rapide par joueur et type de partie
db.exec(`CREATE INDEX IF NOT EXISTS idx_game_history_player1 ON game_history(player1_id, played_at DESC)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_game_history_player2 ON game_history(player2_id, played_at DESC)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_game_history_type ON game_history(game_type, played_at DESC)`);

console.log('[DB] Base de données initialisée avec succès');

module.exports = db;
