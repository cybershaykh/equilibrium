import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserWithPasswordHash } from "@/lib/users";
import { getSession } from "@/lib/session";
import { error } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Enter a valid email address.");
  if (password.length < 8) return error("Password must be at least 8 characters.");
  if (name.length < 2) return error("Enter your name.");
  if (getUserWithPasswordHash(email)) return error("An account with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ email, passwordHash, name });

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ user }, { status: 201 });
}