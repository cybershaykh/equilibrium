import { requireUser, ok } from "@/lib/api-helpers";
import { getFeed } from "@/lib/goals";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const goals = getFeed(auth.user.id, { category, q });
  return ok({ goals });
}