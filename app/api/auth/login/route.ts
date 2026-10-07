import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserWithPasswordHash, findUserById } from "@/lib/users";
import { getSession } from "@/lib/session";
import { error } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) return error("Enter your email and password.");

  const row = getUserWithPasswordHash(email);
  if (!row) return error("Invalid email or password.", 401);

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return error("Invalid email or password.", 401);

  const user = findUserById(row.id)!;

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ user });
}