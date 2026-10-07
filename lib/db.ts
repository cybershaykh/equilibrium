import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __equilibriumDb: Database.Database | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_date INTEGER,
  target_value REAL NOT NULL,
  unit TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  current_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  seeking_partner INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_feed ON goals(seeking_partner, status);

CREATE TABLE IF NOT EXISTS partnerships (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL REFERENCES users(id),
  recipient_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  responded_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_partnerships_user ON partnerships(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_partnerships_goal ON partnerships(goal_id);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  progress REAL NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_goal ON checkins(goal_id, created_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  partnership_id TEXT NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_partner ON messages(partnership_id, created_at);

CREATE TABLE IF NOT EXISTS conversation_seen (
  partnership_id TEXT NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (partnership_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  ref_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at);
`;

function init(): Database.Database {
  if (globalThis.__equilibriumDb) return globalThis.__equilibriumDb;

  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });

  const db = new Database(path.join(dir, "equilibrium.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 30000");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  globalThis.__equilibriumDb = db;
  return db;
}

// Lazy proxy so that importing this module during `next build` (page-data
// collection) does not open a SQLite connection, which avoids evil lock
// contention between Turbopack workers.
export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    return Reflect.get(init(), prop);
  },
});