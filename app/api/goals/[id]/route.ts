import { requireUser, ok, error } from "@/lib/api-helpers";
import {
  getCheckinsForGoal,
  updateGoal,
  deleteGoal,
  getGoalDetail,
  addCheckinWithValue,
  getPartnerForGoal,
} from "@/lib/goals";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const detail = getGoalDetail(id, auth.user.id);
  if (!detail) return error("Goal not found.", 404);

  const partner = getPartnerForGoal(id);
  const isOwnerOrPartner =
    detail.meIsOwner || (partner && (partner.requesterId === auth.user.id || partner.recipientId === auth.user.id));

  return ok({
    goal: detail,
    checkins: isOwnerOrPartner ? getCheckinsForGoal(id) : [],
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const existing = getGoalDetail(id, auth.user.id);
  if (!existing) return error("Goal not found.", 404);
  if (!existing.meIsOwner) return error("You can only edit your own goals.", 403);

  const body = await req.json().catch(() => null);
  const patch: any = {};

  if (body?.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return error("Give your goal a title.");
    patch.title = title;
  }
  if (body?.category !== undefined) {
    patch.category = String(body.category);
  }
  if (body?.targetDate !== undefined) {
    patch.targetDate = body.targetDate ? new Date(String(body.targetDate)).getTime() : null;
  }
  if (body?.targetValue !== undefined) {
    const v = Number(body.targetValue);
    if (!isFinite(v) || v <= 0) return error("Target value must be a positive number.");
    patch.targetValue = v;
  }
  if (body?.unit !== undefined) {
    const u = String(body.unit).trim();
    if (!u) return error("Enter a unit.");
    patch.unit = u;
  }
  if (body?.detail !== undefined) {
    patch.detail = String(body.detail).trim();
  }
  if (body?.status !== undefined) {
    if (!["active", "paused", "completed"].includes(String(body.status))) return error("Invalid status.");
    patch.status = String(body.status);
  }
  if (body?.seekingPartner !== undefined) {
    patch.seekingPartner = !!body.seekingPartner;
  }
  if (body?.currentValue !== undefined) {
    const v = Number(body.currentValue);
    if (!isFinite(v) || v < 0) return error("Current value must be a positive number.");
    addCheckinWithValue(id, auth.user.id, v, body?.note ? String(body.note) : "");
    return ok({ updatedGoal: getGoalDetail(id, auth.user.id) });
  }

  const goal = updateGoal(id, patch);
  return ok({ goal });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const detail = getGoalDetail(id, auth.user.id);
  if (!detail) return error("Goal not found.", 404);
  if (!detail.meIsOwner) return error("You can only delete your own goals.", 403);

  deleteGoal(id);
  return ok({ ok: true });
}