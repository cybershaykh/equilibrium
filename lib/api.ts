import type {
  Goal,
  GoalDetail,
  FeedItem,
  Checkin,
  Partnership,
  Stats,
  Activity,
  Notification,
  Message,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ApiError(data?.error ?? "Something went wrong", res.status);
  }
  return data as T;
}

export const api = {
  me: () => request<{ user: any }>("/api/users/me"),

  register: (name: string, email: string, password: string) =>
    request<{ user: any }>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  login: (email: string, password: string) =>
    request<{ user: any }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  myGoals: () => request<{ goals: Goal[] }>("/api/goals/mine"),

  createGoal: (input: Record<string, unknown>) =>
    request<{ goal: Goal }>("/api/goals", { method: "POST", body: JSON.stringify(input) }),

  feed: (category?: string, q?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    return request<{ goals: FeedItem[] }>(`/api/goals/feed?${params.toString()}`);
  },

  goal: (id: string) => request<{ goal: GoalDetail; checkins: Checkin[] }>(`/api/goals/${id}`),

  updateGoal: (id: string, input: Record<string, unknown>) =>
    request<{ goal: Goal; updatedGoal?: GoalDetail }>(`/api/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteGoal: (id: string) => request<{ ok: boolean }>(`/api/goals/${id}`, { method: "DELETE" }),

  checkin: (goalId: string, amount: number, note: string) =>
    request<{ checkin: Checkin; goal: Goal }>("/api/checkins", {
      method: "POST",
      body: JSON.stringify({ goalId, amount, note }),
    }),

  partners: () => request<{ conversations: any[]; incoming: any[] }>("/api/partners"),

  requestPartnership: (goalId: string, recipientId: string) =>
    request<{ partnership: Partnership }>("/api/partners", {
      method: "POST",
      body: JSON.stringify({ goalId, recipientId }),
    }),

  respondToPartnership: (id: string, status: "accepted" | "declined") =>
    request<{ partnership: Partnership }>(`/api/partners/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  messages: (partnershipId: string) =>
    request<{ messages: Message[]; partnership: any; goal: Goal; other: any }>(`/api/partners/${partnershipId}/messages`),

  sendMessage: (partnershipId: string, content: string) =>
    request<{ message: Message }>(`/api/partners/${partnershipId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  notifications: () => request<{ notifications: Notification[]; unread: number }>("/api/notifications"),

  markNotificationsRead: (ids?: string[]) =>
    request<{ ok: boolean }>("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify(ids ? { id: ids[0] } : { all: true }),
    }),

  activity: () => request<{ activity: Activity[] }>("/api/activity"),

  stats: () => request<{ stats: Stats }>("/api/stats"),
};

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}