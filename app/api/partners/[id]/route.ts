import { requireUser, ok, error } from "@/lib/api-helpers";
import {
  getPartnershipById,
  respondToPartnership,
  getGoalById,
  createNotification,
  findUserById,
} from "@/lib/goals";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const partnership = getPartnershipById(id);
  if (!partnership) return error("Request not found.", 404);
  if (partnership.recipientId !== auth.user.id) return error("Only the recipient can respond.", 403);

  const body = await req.json().catch(() => null);
  const status = String(body?.status ?? "");
  if (status !== "accepted" && status !== "declined") return error("Invalid status.");

  const updated = respondToPartnership(id, status);
  const goal = getGoalById(partnership.goalId);

  if (status === "accepted" && goal) {
    createNotification({
      userId: partnership.requesterId,
      type: "partnership_accepted",
      refId: partnership.id,
      title: "Request accepted",
      body: `${auth.user.name} accepted your request to partner on “${goal.title}”. Say hi in messages!`,
    });
  } else if (goal) {
    createNotification({
      userId: partnership.requesterId,
      type: "partnership_declined",
      refId: partnership.id,
      title: "Request declined",
      body: `${auth.user.name} declined your request on “${goal.title}”. Keep looking — your person is out there.`,
    });
  }

  const otherUser = findUserById(partnership.requesterId);
  return ok({ partnership: updated, otherUser, goal });
}