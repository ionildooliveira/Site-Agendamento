const { getDB } = require('./db');

function initializeDatabase() {
  const db = getDB();

  db.exec(`
    -- ── Admin Users ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Clients ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS clients (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Professionals ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS professionals (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      role        TEXT NOT NULL,
      bio         TEXT,
      photo_url   TEXT,
      specialties TEXT DEFAULT '[]',
      active      INTEGER DEFAULT 1
    );

    -- ── Services ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS services (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      description      TEXT,
      price            REAL    NOT NULL,
      duration_minutes INTEGER NOT NULL,
      category         TEXT,
      active           INTEGER DEFAULT 1
    );

    -- ── Bookings ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bookings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id       INTEGER REFERENCES clients(id),
      professional_id INTEGER REFERENCES professionals(id),
      service_id      INTEGER REFERENCES services(id),
      booking_date    TEXT    NOT NULL,
      start_time      TEXT    NOT NULL,
      end_time        TEXT    NOT NULL,
      status          TEXT    DEFAULT 'confirmed',
      notes           TEXT,
      cancel_token    TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Settings ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS settings (
      id            INTEGER PRIMARY KEY DEFAULT 1,
      working_hours TEXT    NOT NULL DEFAULT '{"0":null,"1":{"open":"09:00","close":"19:00"},"2":{"open":"09:00","close":"19:00"},"3":{"open":"09:00","close":"19:00"},"4":{"open":"09:00","close":"19:00"},"5":{"open":"09:00","close":"19:00"},"6":{"open":"09:00","close":"17:00"}}',
      slot_interval INTEGER DEFAULT 30
    );

    -- ── Blocked Dates ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS blocked_dates (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      date            TEXT NOT NULL,
      reason          TEXT,
      professional_id INTEGER
    );
  `);

  try {
    db.exec(`ALTER TABLE professionals ADD COLUMN bio TEXT;`);
  } catch (e) {
    // Column already exists
  }

  console.log('✅ Schema do banco de dados inicializado');
}

module.exports = { initializeDatabase };
