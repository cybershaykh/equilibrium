import { requireUser, ok, error } from "@/lib/api-helpers";
import { createGoalForUser, listGoalsForUser } from "@/lib/goals";
import { GOAL_CATEGORIES, percentComplete, daysLeft } from "@/lib/types";

import { computeStreak } from "@/lib/goals";
import { getPartnerForGoal } from "@/lib/goals";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const goals = listGoalsForUser(auth.user.id).map((g) => ({
    ...g,
    progress: percentComplete(g),
    streakDays: computeStreak(g.id, auth.user.id),
    daysLeft: daysLeft(g.targetDate),
    partner: (() => {
      const p = getPartnerForGoal(g.id);
      return p ? { id: p.id, status: p.status } : null;
    })(),
  }));
  return ok({ goals });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const category = String(body?.category ?? "Wellbeing");
  const targetDate = body?.targetDate ? new Date(String(body.targetDate)).getTime() : null;
  const targetValue = Number(body?.targetValue);
  const unit = String(body?.unit ?? "%").trim();
  const detail = String(body?.detail ?? "").trim();
  const currentValue = body?.currentValue != null ? Number(body.currentValue) : 0;
  const seekingPartner = body?.seekingPartner !== false;

  if (!title) return error("Give your goal a title.");
  if (title.length > 120) return error("Title is too long.");
  if (!GOAL_CATEGORIES.includes(category as any)) return error("Pick a valid category.");
  if (!isFinite(targetValue) || targetValue <= 0) return error("Target value must be a positive number.");
  if (!unit || unit.length > 12) return error("Enter a unit like %, km or books.");
  if (detail.length > 600) return error("Detail is too long.");

  const goal = createGoalForUser(auth.user.id, {
    title,
    category,
    targetDate,
    targetValue,
    unit,
    detail,
    currentValue,
    seekingPartner,
  });

  return ok({ goal }, 201);
}