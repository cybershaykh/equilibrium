import { requireUser, ok } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  return ok({ user: auth.user });
}