import { requireUser, ok, error } from "@/lib/api-helpers";
import {
  getPartnershipById,
  listMessages,
  sendMessage,
  conversationSeen,
  createNotification,
  getGoalById,
  findUserById,
} from "@/lib/goals";

type Params = { params: Promise<{ id: string }> };

function isParticipant(p: { requesterId: string; recipientId: string }, userId: string) {
  return p.requesterId === userId || p.recipientId === userId;
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const partnership = getPartnershipById(id);
  if (!partnership) return error("Partnership not found.", 404);
  if (partnership.status !== "accepted") return error("Partnership is not active.", 403);
  if (!isParticipant(partnership, auth.user.id)) return error("Not your conversation.", 403);

  const messages = listMessages(id);
  const goal = getGoalById(partnership.goalId);
  const other = findUserById(
    partnership.requesterId === auth.user.id ? partnership.recipientId : partnership.requesterId
  );

  conversationSeen(id, auth.user.id, Date.now());

  return ok({ messages, partnership, goal, other });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const partnership = getPartnershipById(id);
  if (!partnership) return error("Partnership not found.", 404);
  if (partnership.status !== "accepted") return error("Partnership is not active.", 403);
  if (!isParticipant(partnership, auth.user.id)) return error("Not your conversation.", 403);

  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  if (!content) return error("Message can't be empty.");
  if (content.length > 1000) return error("Message is too long.");

  const message = sendMessage(id, auth.user.id, content);

  const otherId = partnership.requesterId === auth.user.id ? partnership.recipientId : partnership.requesterId;
  const goal = getGoalById(partnership.goalId);
  createNotification({
    userId: otherId,
    type: "message",
    refId: id,
    title: "New message",
    body: `${auth.user.name}: “${content.slice(0, 80)}”${goal ? ` (${goal.title})` : ""}`,
  });

  return ok({ message }, 201);
}