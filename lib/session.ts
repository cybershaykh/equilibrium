import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_SECRET ?? "dev_secret_please_change_me_1234567890abcdef",
  cookieName: "equilibrium_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  const store = await cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}

export function sessionCookieOptions() {
  return sessionOptions.cookieOptions;
}

export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

export function parseError() {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}