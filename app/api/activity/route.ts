import { requireUser, ok } from "@/lib/api-helpers";
import { getActivity } from "@/lib/goals";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  return ok({ activity: getActivity(auth.user.id) });
}