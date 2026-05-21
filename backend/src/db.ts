import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'absolutely-wrong.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db: Database.Database = new Database(DB_PATH);

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'bot')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active_at);
`);

// Prepared statements for performance
const getSession = db.prepare('SELECT id, created_at, last_active_at FROM sessions WHERE id = ?');
const createSession = db.prepare('INSERT INTO sessions (id) VALUES (?)');
const touchSession = db.prepare("UPDATE sessions SET last_active_at = datetime('now') WHERE id = ?");
const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
const getMessages = db.prepare('SELECT id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC');
const deleteMessages = db.prepare('DELETE FROM messages WHERE session_id = ?');
const deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');

// Periodic cleanup of old sessions (runs every hour)
function cleanupOldSessions() {
  db.exec(`
    DELETE FROM messages WHERE session_id IN (
      SELECT id FROM sessions WHERE last_active_at < datetime('now', '-7 days')
    );
    DELETE FROM sessions WHERE last_active_at < datetime('now', '-7 days');
  `);
}

// Run cleanup on startup and every hour
cleanupOldSessions();
setInterval(cleanupOldSessions, 60 * 60 * 1000);

export {
  db,
  getSession,
  createSession,
  touchSession,
  insertMessage,
  getMessages,
  deleteMessages,
  deleteSession,
};
