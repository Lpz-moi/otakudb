import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = process.env.DATABASE_URL || path.join(dataDir, 'otakudb.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Database connected:', DB_PATH);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          discord_id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          avatar TEXT,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
      });

      // Anime list table
      db.run(`
        CREATE TABLE IF NOT EXISTS anime_list (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_discord_id TEXT NOT NULL,
          anime_id INTEGER NOT NULL,
          anime_title TEXT NOT NULL,
          anime_image TEXT,
          status TEXT DEFAULT 'planned',
          progress INTEGER DEFAULT 0,
          rating REAL,
          notes TEXT,
          is_favorite BOOLEAN DEFAULT 0,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_discord_id, anime_id),
          FOREIGN KEY (user_discord_id) REFERENCES users(discord_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating anime_list table:', err);
      });

      // Preferences table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          discord_id TEXT PRIMARY KEY,
          theme TEXT DEFAULT 'dark',
          notifications_enabled BOOLEAN DEFAULT 1,
          data JSONB,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating user_preferences table:', err);
        else {
          console.log('✅ Database schema initialized');
          resolve();
        }
      });
    });
  });
}

/**
 * Run query with promise wrapper
 */
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * Get single row
 */
export function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

/**
 * Get all rows
 */
export function getAllRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

export default db;
