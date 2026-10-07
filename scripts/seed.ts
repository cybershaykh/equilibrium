/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seeds the local SQLite DB with demo users, goals, check-ins, and a partnership.
 * Run with: npm run seed
 */
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "equilibrium.db");

async function main() {
  const fs = await import("fs");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      name TEXT NOT NULL, avatar_url TEXT, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL, category TEXT NOT NULL, target_date INTEGER,
      target_value REAL NOT NULL, unit TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
      current_value REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active',
      seeking_partner INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS partnerships (
      id TEXT PRIMARY KEY, goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      requester_id TEXT NOT NULL REFERENCES users(id), recipient_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, responded_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY, goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id), progress REAL NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, partnership_id TEXT NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id), content TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversation_seen (
      partnership_id TEXT NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id), last_seen_at INTEGER NOT NULL,
      PRIMARY KEY (partnership_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL, ref_id TEXT, title TEXT NOT NULL, body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
    );
  `);

  const exists = db.prepare("SELECT COUNT(*) AS c FROM users").get() as any;
  if (exists.c > 0) {
    console.log("DB already seeded — skipping.");
    db.close();
    return;
  }

  const hash = await bcrypt.hash("password123", 10);
  const now = Date.now();
  const day = 86400000;
  const uuid = () => crypto.randomUUID();

  const insertUser = db.prepare(
    "INSERT INTO users (id, email, password_hash, name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertGoal = db.prepare(
    `INSERT INTO goals (id, user_id, title, category, target_date, target_value, unit, detail, current_value, status, seeking_partner, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?)`
  );
  const insertCheckin = db.prepare(
    "INSERT INTO checkins (id, goal_id, user_id, progress, note, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertPartnership = db.prepare(
    "INSERT INTO partnerships (id, goal_id, requester_id, recipient_id, status, created_at, responded_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertMessage = db.prepare(
    "INSERT INTO messages (id, partnership_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
  );

  const users = [
    { email: "demo@equilibrium.app", name: "Alex Morgan" },
    { email: "sam@equilibrium.app", name: "Sam Rivera" },
    { email: "priya@equilibrium.app", name: "Priya Nair" },
    { email: "leo@equilibrium.app", name: "Leo Kim" },
  ];
  const userIds = users.map((u) => {
    const id = uuid();
    insertUser.run(id, u.email, hash, u.name, null, now - 30 * day);
    return { ...u, id };
  });

  const demo = userIds[0];
  const sam = userIds[1];

  // Demo user's goals
  const runGoalId = uuid();
  insertGoal.run(
    runGoalId, demo.id, "Run 5k without stopping", "Fitness", now + 60 * day, 5, "km",
    "Build up gradually — walk-run intervals are still progress.", 1.6, now - 12 * day, now - 12 * day
  );
  const readGoalId = uuid();
  insertGoal.run(
    readGoalId, demo.id, "Read 24 books this year", "Personal growth", now + 200 * day, 24, "books",
    "One chapter a day keeps the scroll away.", 7, now - 25 * day, now - 25 * day
  );
  const buildGoalId = uuid();
  insertGoal.run(
    buildGoalId, demo.id, "Ship a side project", "Career", now + 90 * day, 1, "project",
    "Anything real, in public, that people can use.", 0.3, now - 8 * day, now - 8 * day
  );

  // Seed demo user's running streak over the last 5 days
  const runNotes = ["Easy 3k. Felt light.", "Intervals: 6 x 400m.", "Rest-day mobility, still showed up.", "5k PR attempt — close!", "Rain run. Worth it."];
  let runCurrent = 1.6;
  for (let i = 4; i >= 0; i--) {
    runCurrent += 0.5 + (i % 2) * 0.3;
    const ts = now - i * day;
    insertCheckin.run(uuid(), runGoalId, demo.id, Math.round((runCurrent - (i === 4 ? 1.6 : runCurrent - 0.8 - (i % 2) * 0.3)) * 100) / 100, runNotes[i], ts - 3600000);
  }

  // Sam's goal seeking a partner
  const samGoalId = uuid();
  insertGoal.run(
    samGoalId, sam.id, "Meditate 20 minutes daily", "Wellbeing", now + 45 * day, 20, "minutes/day",
    "Mornings are chaos — this is my quiet hour.", 12, now - 10 * day, now - 10 * day
  );
  for (let i = 3; i >= 0; i--) {
    insertCheckin.run(uuid(), samGoalId, sam.id, 20, i === 1 ? "Deep session today. Skin-crawling calm." : "", now - i * day);
  }

  // Priya & Leo goals for the discover feed
  insertGoal.run(
    uuid(), userIds[2].id, "Finish 10 UI challenges", "Creative", now + 30 * day, 10, "challenges",
    "Design is a muscle. Training daily.", 4, now - 6 * day, now - 6 * day
  );
  insertGoal.run(
    uuid(), userIds[3].id, "Save $5,000 emergency fund", "Wellbeing", now + 180 * day, 5000, "$",
    "Future me says thanks.", 1800, now - 40 * day, now - 40 * day
  );

  // Accepted partnership: Sam partnered with demo on demo's reading goal
  const partnershipId = uuid();
  insertPartnership.run(partnershipId, readGoalId, sam.id, demo.id, "accepted", now - 6 * day, now - 6 * day + 3600000);

  insertMessage.run(uuid(), partnershipId, sam.id, "Hey Alex! Saw you're 7 books in — how was the last one?", now - 5 * day);
  insertMessage.run(uuid(), partnershipId, demo.id, "Slow burn but good. Mid-book slump though — you're my witness now, no slacking!", now - 5 * day + 3600000);
  insertMessage.run(uuid(), partnershipId, sam.id, "Deal. I meditated 20 min today. Your turn: 10 pages before bed?", now - 1 * day);

  db.prepare(
    "INSERT INTO conversation_seen (partnership_id, user_id, last_seen_at) VALUES (?, ?, ?)"
  ).run(partnershipId, demo.id, now);

  console.log("Seeded demo data:");
  for (const u of users) console.log(`  ${u.email} / password123  (${u.name})`);
  console.log("Including a partnership with chat history and an active streak.");
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});