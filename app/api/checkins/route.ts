import { requireUser, ok, error } from "@/lib/api-helpers";
import { addCheckin, getGoalById, createNotification, getPartnerForGoal } from "@/lib/goals";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const goalId = String(body?.goalId ?? "");
  const note = String(body?.note ?? "").trim();
  const amount = Number(body?.amount ?? 0);

  const goal = getGoalById(goalId);
  if (!goal) return error("Goal not found.", 404);

  const isOwner = goal.userId === auth.user.id;
  const partner = getPartnerForGoal(goalId);
  const isPartner = !!partner && (partner.requesterId === auth.user.id || partner.recipientId === auth.user.id);
  if (!isOwner && !isPartner) return error("You're not part of this goal.", 403);

  if (!isFinite(amount) || amount < 0) return error("Progress must be a positive number.");
  if (note.length > 300) return error("Note is too long.");

  const checkin = addCheckin(goalId, auth.user.id, amount, note);

  if (isOwner && partner) {
    const otherId = partner.requesterId === auth.user.id ? partner.recipientId : partner.requesterId;
    createNotification({
      userId: otherId,
      type: "checkin",
      refId: goalId,
      title: "Your partner checked in",
      body: `“${checkin.note || "Checked in"}” on ${goal.title}`,
    });
  }

  return ok({ checkin, goal: getGoalById(goalId) }, 201);
}