export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: number;
};

export const GOAL_CATEGORIES = [
  "Wellbeing",
  "Fitness",
  "Personal growth",
  "Career",
  "Creative",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export type GoalStatus = "active" | "paused" | "completed";

export type Goal = {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetDate: number | null;
  targetValue: number;
  unit: string;
  detail: string;
  currentValue: number;
  status: GoalStatus;
  seekingPartner: boolean;
  createdAt: number;
  updatedAt: number;
};

export type PartnershipStatus = "pending" | "accepted" | "declined";

export type Partnership = {
  id: string;
  goalId: string;
  requesterId: string;
  recipientId: string;
  status: PartnershipStatus;
  createdAt: number;
  respondedAt: number | null;
};

export type Checkin = {
  id: string;
  goalId: string;
  userId: string;
  progress: number;
  note: string;
  createdAt: number;
};

export type Message = {
  id: string;
  partnershipId: string;
  senderId: string;
  content: string;
  createdAt: number;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  refId: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
};

export type MyGoal = Goal & {
  progress: number;
  streakDays: number;
  daysLeft: number | null;
  partner: { id: string; status: PartnershipStatus } | null;
};

export type GoalDetail = Goal & {
  owner: User;
  progress: number;
  streak: number;
  daysLeft: number | null;
  partnerships: {
    id: string;
    status: PartnershipStatus;
    userMe: boolean;
    otherUser: User | null;
  }[];
  meIsOwner: boolean;
};

export type FeedItem = Goal & {
  owner: User;
  progress: number;
  streak: number;
  myRequest: { id: string; status: PartnershipStatus } | null;
  hasActivePartner: boolean;
};

export type Activity = {
  id: string;
  type: "checkin" | "goal" | "partnership";
  label: string;
  goalTitle: string;
  createdAt: number;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
};

export type Stats = {
  activeGoals: number;
  completedGoals: number;
  totalGoals: number;
  currentStreak: number;
  totalCheckins: number;
  partners: number;
  pendingRequests: number;
};

export function percentComplete(goal: Pick<Goal, "currentValue" | "targetValue">): number {
  if (!goal.targetValue) return 0;
  return Math.max(0, Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)));
}

export function daysLeft(ts: number | null): number | null {
  if (!ts) return null;
  const start = new Date(new Date().toDateString()).getTime();
  const end = new Date(new Date(ts).toDateString()).getTime();
  return Math.ceil((end - start) / 86400000);
}