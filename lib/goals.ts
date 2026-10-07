import "server-only";

import { db } from "./db";
import type {
  Activity,
  Checkin,
  FeedItem,
  Goal,
  GoalDetail,
  Message,
  Notification,
  Partnership,
  PartnershipStatus,
  Stats,
  User,
} from "./types";
import { daysLeft, percentComplete } from "./types";
import { findUserById } from "./users";

const GOAL_COLUMNS =
  "id, user_id, title, category, target_date, target_value, unit, detail, current_value, status, seeking_partner, created_at, updated_at";

function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    targetDate: row.target_date,
    targetValue: row.target_value,
    unit: row.unit,
    detail: row.detail,
    currentValue: row.current_value,
    status: row.status,
    seekingPartner: !!row.seeking_partner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPartnership(row: any): Partnership {
  return {
    id: row.id,
    goalId: row.goal_id,
    requesterId: row.requester_id,
    recipientId: row.recipient_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

function rowToCheckin(row: any): Checkin {
  return {
    id: row.id,
    goalId: row.goal_id,
    userId: row.user_id,
    progress: row.progress,
    note: row.note,
    createdAt: row.created_at,
  };
}

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    partnershipId: row.partnership_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    refId: row.ref_id,
    title: row.title,
    body: row.body,
    read: !!row.read,
    createdAt: row.created_at,
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ---------- Goals ----------

export function getGoalById(id: string): Goal | null {
  const row = db.prepare(`SELECT ${GOAL_COLUMNS} FROM goals WHERE id = ?`).get(id);
  return row ? rowToGoal(row) : null;
}

export function getGoalStrict(id: string): Goal {
  const goal = getGoalById(id);
  if (!goal) throw new Error("Goal not found");
  return goal;
}

export function listGoalsForUser(userId: string): Goal[] {
  const rows = db
    .prepare(`SELECT ${GOAL_COLUMNS} FROM goals WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId) as any[];
  return rows.map(rowToGoal);
}

export function listActiveGoalsForUser(userId: string): Goal[] {
  const rows = db
    .prepare(
      `SELECT ${GOAL_COLUMNS} FROM goals WHERE user_id = ? AND status = 'active' ORDER BY target_date ASC, created_at DESC`
    )
    .all(userId) as any[];
  return rows.map(rowToGoal);
}

export function createGoalForUser(
  userId: string,
  input: {
    title: string;
    category: string;
    targetDate: number | null;
    targetValue: number;
    unit: string;
    detail: string;
    currentValue?: number;
    seekingPartner?: boolean;
  }
): Goal {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO goals (id, user_id, title, category, target_date, target_value, unit, detail, current_value, status, seeking_partner, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`
  ).run(
    id,
    userId,
    input.title.trim(),
    input.category,
    input.targetDate,
    input.targetValue,
    input.unit,
    input.detail.trim(),
    input.currentValue ?? 0,
    input.seekingPartner !== false ? 1 : 0,
    now,
    now
  );
  return getGoalStrict(id);
}

export function updateGoal(id: string, patch: Partial<Goal>): Goal | null {
  const existing = getGoalById(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updatedAt: Date.now() };
  db.prepare(
    `UPDATE goals SET title=?, category=?, target_date=?, target_value=?, unit=?, detail=?, current_value=?, status=?, seeking_partner=?, updated_at=? WHERE id=?`
  ).run(
    next.title,
    next.category,
    next.targetDate,
    next.targetValue,
    next.unit,
    next.detail,
    next.currentValue,
    next.status,
    next.seekingPartner ? 1 : 0,
    next.updatedAt,
    id
  );
  return getGoalById(id);
}

export function deleteGoal(id: string) {
  db.prepare("DELETE FROM goals WHERE id = ?").run(id);
}

export function addCheckin(goalId: string, userId: string, progress: number, note: string): Checkin {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    "INSERT INTO checkins (id, goal_id, user_id, progress, note, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, goalId, userId, progress, note.trim(), now);

  const goal = getGoalStrict(goalId);
  updateGoal(goalId, { currentValue: round2(goal.currentValue + progress) });
  return { id, goalId, userId, progress, note: note.trim(), createdAt: now };
}

export function addCheckinWithValue(goalId: string, userId: string, newValue: number, note: string): Checkin {
  const goal = getGoalStrict(goalId);
  const delta = round2(newValue - goal.currentValue);
  return addCheckin(goalId, userId, delta, note);
}

export function computeStreak(goalId: string, userId: string): number {
  const rows = db
    .prepare(
      "SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS d FROM checkins WHERE goal_id = ? AND user_id = ?"
    )
    .all(goalId, userId) as any[];
  const days = new Set(rows.map((r) => r.d));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function checkin(d: Date) {
  return fmt(d);
}

// ---------- Partnerships ----------

export function listPartnershipsForUser(userId: string, status?: PartnershipStatus): Partnership[] {
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM partnerships WHERE (requester_id = ? OR recipient_id = ?) AND status = ? ORDER BY created_at DESC"
        )
        .all(userId, userId, status)
    : db
        .prepare("SELECT * FROM partnerships WHERE (requester_id = ? OR recipient_id = ?) ORDER BY created_at DESC")
        .all(userId, userId);
  return (rows as any[]).map(rowToPartnership);
}

export function getPartnershipById(id: string): Partnership | null {
  const row = db.prepare("SELECT * FROM partnerships WHERE id = ?").get(id);
  return row ? rowToPartnership(row) : null;
}

export function getPartnerForGoal(goalId: string): Partnership | null {
  const row = db
    .prepare("SELECT * FROM partnerships WHERE goal_id = ? AND status = 'accepted' ORDER BY responded_at DESC LIMIT 1")
    .get(goalId);
  return row ? rowToPartnership(row) : null;
}

export function getMyPendingRequest(goalId: string, userId: string): Partnership | null {
  const row = db
    .prepare("SELECT * FROM partnerships WHERE goal_id = ? AND requester_id = ? AND status = 'pending'")
    .get(goalId, userId);
  return row ? rowToPartnership(row) : null;
}

export function getIncomingRequest(goalId: string, userId: string): Partnership | null {
  const row = db
    .prepare("SELECT * FROM partnerships WHERE goal_id = ? AND recipient_id = ? AND status = 'pending'")
    .get(goalId, userId);
  return row ? rowToPartnership(row) : null;
}

export function createPartnership(goalId: string, requesterId: string, recipientId: string): Partnership {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    "INSERT INTO partnerships (id, goal_id, requester_id, recipient_id, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)"
  ).run(id, goalId, requesterId, recipientId, now);
  return getPartnershipById(id)!;
}

export function respondToPartnership(id: string, status: "accepted" | "declined"): Partnership {
  const now = Date.now();
  db.prepare("UPDATE partnerships SET status = ?, responded_at = ? WHERE id = ?").run(status, now, id);
  return getPartnershipById(id)!;
}

export function partnershipPartner(p: Partnership, me: string): User | null {
  if (p.requesterId === me) return findUserById(p.recipientId);
  return findUserById(p.requesterId);
}

// ---------- Feed ----------

const FEED_EXCLUDE = `
NOT EXISTS (
  SELECT 1 FROM partnerships p
  WHERE p.goal_id = goals.id
    AND p.status IN ('accepted','pending')
    AND (p.requester_id = ? OR p.recipient_id = ?)
)
`;

export function getFeed(userId: string, opts: { category?: string; q?: string }): FeedItem[] {
  const clauses: string[] = ["goals.seeking_partner = 1", "goals.status = 'active'", "goals.user_id != ?"];
  const params: any[] = [userId];
  if (opts.category) {
    if (opts.category !== "All") {
      clauses.push("goals.category = ?");
      params.push(opts.category);
    }
  }
  if (opts.q && opts.q.trim()) {
    clauses.push("(goals.title LIKE ? OR goals.detail LIKE ?)");
    params.push(`%${opts.q.trim()}%`, `%${opts.q.trim()}%`);
  }
  const sql = `SELECT goals.* FROM goals WHERE ${clauses.join(" AND ")} AND ${FEED_EXCLUDE} ORDER BY goals.created_at DESC LIMIT 100`;
  const rows = db.prepare(sql).all(...params, userId, userId) as any[];

  return rows.map((row) => {
    const goal = rowToGoal(row);
    const owner = findUserById(goal.userId)!;
    return {
      ...goal,
      owner,
      progress: percentComplete(goal),
      streak: computeStreak(goal.id, goal.userId),
      myRequest: getMyPendingRequest(goal.id, userId)
        ? { id: getMyPendingRequest(goal.id, userId)!.id, status: getMyPendingRequest(goal.id, userId)!.status }
        : null,
      hasActivePartner: false,
    };
  });
}

export function getGoalDetail(goalId: string, viewerId: string): GoalDetail | null {
  const goal = getGoalById(goalId);
  if (!goal) return null;
  const owner = findUserById(goal.userId);
  if (!owner) return null;

  const partnershipRows = db
    .prepare("SELECT * FROM partnerships WHERE goal_id = ? ORDER BY created_at DESC")
    .all(goalId) as any[];
  const partnerships = partnershipRows.map((row) => {
    const p = rowToPartnership(row);
    const otherId = p.requesterId === viewerId ? p.recipientId : p.requesterId;
    return { id: p.id, status: p.status, userMe: p.requesterId === viewerId, otherUser: findUserById(otherId) ?? null };
  });

  return {
    ...goal,
    owner,
    progress: percentComplete(goal),
    streak: computeStreak(goalId, goal.userId),
    daysLeft: daysLeft(goal.targetDate),
    partnerships,
    meIsOwner: goal.userId === viewerId,
  };
}

export function getCheckinsForGoal(goalId: string): Checkin[] {
  const rows = db
    .prepare("SELECT * FROM checkins WHERE goal_id = ? ORDER BY created_at ASC")
    .all(goalId) as any[];
  return rows.map(rowToCheckin);
}

// ---------- Messages ----------

export function conversationSeen(partnershipId: string, userId: string, at: number) {
  db.prepare(
    `INSERT INTO conversation_seen (partnership_id, user_id, last_seen_at) VALUES (?, ?, ?)
     ON CONFLICT(partnership_id, user_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`
  ).run(partnershipId, userId, at);
}

export function unreadMessageCount(partnershipId: string, userId: string): number {
  const seen = db
    .prepare("SELECT last_seen_at FROM conversation_seen WHERE partnership_id = ? AND user_id = ?")
    .get(partnershipId, userId) as any;
  const since = seen ? seen.last_seen_at : 0;
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM messages WHERE partnership_id = ? AND sender_id != ? AND created_at > ?")
    .get(partnershipId, userId, since) as any;
  return row.c;
}

export function listMessages(partnershipId: string): Message[] {
  const rows = db
    .prepare("SELECT * FROM messages WHERE partnership_id = ? ORDER BY created_at ASC LIMIT 500")
    .all(partnershipId) as any[];
  return rows.map(rowToMessage);
}

export function sendMessage(partnershipId: string, senderId: string, content: string): Message {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    "INSERT INTO messages (id, partnership_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, partnershipId, senderId, content.trim(), now);
  return { id, partnershipId, senderId, content: content.trim(), createdAt: now };
}

// ---------- Notifications ----------

export function createNotification(input: {
  userId: string;
  type: string;
  refId?: string;
  title: string;
  body: string;
}) {
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO notifications (id, user_id, type, ref_id, title, body, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)"
  ).run(id, input.userId, input.type, input.refId ?? null, input.title, input.body, Date.now());
}

export function listNotifications(userId: string): Notification[] {
  const rows = db
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(userId) as any[];
  return rows.map(rowToNotification);
}

export function unreadNotificationsCount(userId: string): number {
  const row = db.prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0").get(userId) as any;
  return row.c;
}

export function markNotificationRead(id: string) {
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
}

export function markAllNotificationsRead(userId: string) {
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
}

// ---------- Activity ----------

export function getActivity(userId: string): Activity[] {
  const activity: Activity[] = [];

  const goalIds = (db.prepare("SELECT id FROM goals WHERE user_id = ?").all(userId) as any[]).map((r) => r.id);

  if (goalIds.length) {
    const inClause = goalIds.map(() => "?").join(",");
    const checkinRows = db
      .prepare(
        `SELECT c.id, c.created_at, c.user_id, c.note, u.name AS user_name, u.avatar_url AS user_avatar_url, g.title AS goal_title
         FROM checkins c
         JOIN users u ON u.id = c.user_id
         JOIN goals g ON g.id = c.goal_id
         WHERE c.goal_id IN (${inClause})
         ORDER BY c.created_at DESC LIMIT 30`
      )
      .all(...goalIds) as any[];
    for (const r of checkinRows) {
      activity.push({
        id: `c-${r.id}`,
        type: "checkin",
        goalTitle: r.goal_title,
        createdAt: r.created_at,
        userId: r.user_id,
        userName: r.user_name,
        userAvatarUrl: r.user_avatar_url,
        label: r.note ? `“${r.note}”` : "Checked in",
      });
    }
  }

  const goalRows = db
    .prepare("SELECT id, title, created_at, user_id FROM goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
    .all(userId) as any[];
  for (const r of goalRows) {
    activity.push({
      id: `g-${r.id}`,
      type: "goal",
      goalTitle: r.title,
      createdAt: r.created_at,
      userId: r.user_id,
      userName: "",
      userAvatarUrl: null,
      label: "Posted a new goal",
    });
  }

  const accepted = listPartnershipsForUser(userId, "accepted");
  for (const p of accepted) {
    const other = partnershipPartner(p, userId);
    const goal = getGoalById(p.goalId);
    activity.push({
      id: `p-${p.id}`,
      type: "partnership",
      goalTitle: goal?.title ?? "a goal",
      createdAt: p.respondedAt ?? p.createdAt,
      userId,
      userName: other?.name ?? "Partner",
      userAvatarUrl: other?.avatarUrl ?? null,
      label: `Matched with ${other?.name ?? "a partner"}`,
    });
  }

  return activity.sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
}

// ---------- Stats ----------

export function getStats(userId: string): Stats {
  const goals = listGoalsForUser(userId);
  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  let currentStreak = 0;
  for (const g of active) {
    currentStreak = Math.max(currentStreak, computeStreak(g.id, userId));
  }
  const totalCheckins = (db
    .prepare(
      "SELECT COUNT(*) AS c FROM checkins WHERE goal_id IN (SELECT id FROM goals WHERE user_id = ?)"
    )
    .get(userId) as any).c;
  const partners = listPartnershipsForUser(userId, "accepted").length;
  const pendingRequests = (db
    .prepare("SELECT COUNT(*) AS c FROM partnerships WHERE recipient_id = ? AND status = 'pending'")
    .get(userId) as any).c;

  return {
    activeGoals: active.length,
    completedGoals: completed.length,
    totalGoals: goals.length,
    currentStreak,
    totalCheckins,
    partners,
    pendingRequests,
  };
}

export * from "./users";