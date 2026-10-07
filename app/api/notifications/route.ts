import { requireUser, ok, error } from "@/lib/api-helpers";
import { listNotifications, markNotificationRead, markAllNotificationsRead, unreadNotificationsCount } from "@/lib/goals";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const items = listNotifications(auth.user.id);
  const unread = unreadNotificationsCount(auth.user.id);
  return ok({ notifications: items, unread });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => null);

  if (body?.all) {
    markAllNotificationsRead(auth.user.id);
  } else if (body?.id) {
    markNotificationRead(String(body.id));
  } else {
    return error("Provide a notification id or { all: true }.");
  }

  return ok({ ok: true });
}