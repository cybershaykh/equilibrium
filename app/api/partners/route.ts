import { requireUser, ok, error } from "@/lib/api-helpers";
import {
  listPartnershipsForUser,
  getGoalById,
  createPartnership,
  partnershipPartner,
  unreadMessageCount,
  getMyPendingRequest,
  getPartnerForGoal,
  createNotification,
  findUserById,
} from "@/lib/goals";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const pending = listPartnershipsForUser(auth.user.id, "pending").filter(
    (p) => p.recipientId === auth.user.id
  );
  const accepted = listPartnershipsForUser(auth.user.id, "accepted");

  const conversations = accepted.map((p) => {
    const goal = getGoalById(p.goalId);
    const other = partnershipPartner(p, auth.user.id);
    return {
      partnershipId: p.id,
      goalId: p.goalId,
      goalTitle: goal?.title ?? "Goal",
      goalCategory: goal?.category ?? "",
      partner: other,
      unread: unreadMessageCount(p.id, auth.user.id),
      createdAt: p.respondedAt ?? p.createdAt,
    };
  });

  const incoming = pending.map((p) => {
    const goal = getGoalById(p.goalId);
    const requester = findUserById(p.requesterId);
    return {
      partnershipId: p.id,
      goalId: p.goalId,
      goalTitle: goal?.title ?? "Goal",
      requester,
      createdAt: p.createdAt,
    };
  });

  return ok({ conversations, incoming });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const goalId = String(body?.goalId ?? "");
  const recipientId = String(body?.recipientId ?? "");

  const goal = getGoalById(goalId);
  if (!goal) return error("Goal not found.", 404);
  if (goal.userId === auth.user.id) return error("You can't request your own goal.", 400);
  if (!goal.seekingPartner) return error("This goal is not seeking a partner.", 400);
  if (getPartnerForGoal(goalId)) return error("This goal already has a partner.", 400);
  if (getMyPendingRequest(goalId, auth.user.id)) return error("Request already sent.", 400);
  if (goal.userId !== recipientId) return error("Invalid recipient.", 400);

  const partnership = createPartnership(goalId, auth.user.id, recipientId);

  createNotification({
    userId: recipientId,
    type: "partnership_request",
    refId: partnership.id,
    title: "New partnership request",
    body: `${auth.user.name} wants to be your accountability partner for “${goal.title}”.`,
  });

  return ok({ partnership }, 201);
}