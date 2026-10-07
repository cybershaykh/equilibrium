import { requireUser, ok } from "@/lib/api-helpers";
import { getStats } from "@/lib/goals";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  return ok({ stats: getStats(auth.user.id) });
}