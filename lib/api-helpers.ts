import "server-only";

import { NextResponse } from "next/server";
import { getSession } from "./session";
import { findUserById } from "./users";
import type { User } from "./types";

export async function requireUser(): Promise<{ user: User } | { response: NextResponse }> {
  const session = await getSession();
  const userId = session.userId;
  if (!userId) return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const user = findUserById(userId);
  if (!user) return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  return { user };
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}