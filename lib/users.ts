import "server-only";

import { db } from "./db";
import type { User } from "./types";

const USER_COLUMNS = "id, email, password_hash, name, avatar_url, created_at";

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function findUserByEmail(email: string): User | null {
  const row = db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`).get(email.toLowerCase());
  return row ? rowToUser(row) : null;
}

export function findUserById(id: string): User | null {
  const row = db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(id);
  return row ? rowToUser(row) : null;
}

export function getUserWithPasswordHash(email: string) {
  return db
    .prepare("SELECT id, email, password_hash, name, avatar_url, created_at FROM users WHERE email = ?")
    .get(email.toLowerCase()) as any;
}

export function createUser(input: { email: string; passwordHash: string; name: string }) {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, input.email.toLowerCase(), input.passwordHash, input.name, null, now);
  return findUserById(id)!;
}

export function listUsersByIds(ids: string[]): User[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id IN (${placeholders})`)
    .all(...ids) as any[];
  return rows.map(rowToUser);
}

export function updateUserAvatar(id: string, avatarUrl: string) {
  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, id);
}

export { rowToUser }; // unused externally, keep private