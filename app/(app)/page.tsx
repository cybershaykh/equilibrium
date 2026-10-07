"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flame, Plus, Compass, Trophy, MessageSquareText, Activity, CalendarDays, Handshake, ArrowRight, CheckCircle2 } from "lucide-react";
import { api, timeAgo, formatDate } from "@/lib/api";
import { Card, StatCard, Progress, EmptyState, CategoryBadge, Avatar } from "@/components/ui";
import type { MyGoal, User, Activity as ActivityItem } from "@/lib/types";
import { percentComplete, daysLeft } from "@/lib/types";

export default function DashboardPage() {
  const goals = useQuery({ queryKey: ["my-goals"], queryFn: () => api.myGoals() });
  const partners = useQuery({ queryKey: ["partners"], queryFn: () => api.partners() });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => api.activity() });
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.stats() });

  const myGoals = (goals.data?.goals ?? []) as MyGoal[];
  const activeGoals = myGoals.filter((g) => g.status === "active");
  const conversations = partners.data?.conversations ?? [];
  const incoming = partners.data?.incoming ?? [];

  if (goals.isLoading && !goals.data) {
    return <div className="space-y-4"><Skeleton /><Skeleton /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-extrabold text-ink">My space</h1>
        <p className="text-sm text-stone-500">A little progress is still progress. Keep your promise today.</p>
      </section>

      {stats.data && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active goals" value={stats.data.stats.activeGoals} />
          <StatCard label="Current streak" value={`${stats.data.stats.currentStreak} days`} hint="best active goal" />
          <StatCard label="Check-ins" value={stats.data.stats.totalCheckins} />
          <StatCard label="Partners" value={stats.data.stats.partners} />
        </section>
      )}

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
            <Handshake size={15} /> Partnership requests
          </h2>
          {incoming.map((r) => (
            <RequestCard key={r.partnershipId} r={r} />
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
          <Trophy size={15} /> Your north star
        </h2>
        {activeGoals.length === 0 ? (
          <EmptyState
            icon={<Plus size={26} />}
            title="No active goals yet"
            body="Post a goal, find a partner, and show up together. Small steps, every day."
            action={
              <Link href="/goals/new" className="btn-primary">
                <Plus size={16} /> Post your goal
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {activeGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
            <Handshake size={15} /> In your corner
          </h2>
          {conversations.length === 0 ? (
            <Card className="text-sm text-stone-500">
              No partners yet.{" "}
              <Link href="/discover" className="link">
                Find your match
              </Link>{" "}
              — someone working on the same goal.
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((c) => (
                <Link key={c.partnershipId} href={`/messages/${c.partnershipId}`} className="card flex items-center gap-3 p-3.5 hover:bg-stone-50">
                  <Avatar name={c.partner?.name ?? "?"} url={c.partner?.avatarUrl} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{c.partner?.name}</span>
                    <span className="block truncate text-xs text-stone-500">{c.goalTitle}</span>
                  </span>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                  <MessageSquareText size={16} className="text-stone-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
            <Activity size={15} /> Recent activity
          </h2>
          <Card>
            {!activity.data || activity.data.activity.length === 0 ? (
              <p className="text-sm text-stone-500">Your journey starts with a first step. Post a goal to begin.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-stone-900/5">
                {activity.data.activity.slice(0, 12).map((a) => (
                  <ActivityRow key={a.id} a={a} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {myGoals.filter((g) => g.status !== "active").length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
            <CheckCircle2 size={15} /> Goals worth showing up for
          </h2>
          <div className="flex flex-col gap-2">
            {myGoals
              .filter((g) => g.status !== "active")
              .map((g) => (
                <Link key={g.id} href={`/goals/${g.id}`} className="card flex items-center gap-3 p-3.5 hover:bg-stone-50">
                  <span className={`stamp ${g.status === "completed" ? "border-emerald-600/40 text-emerald-700" : "border-stone-900/20 text-stone-500"}`}>
                    {g.status}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{g.title}</span>
                  <span className="text-xs text-stone-400">{Math.round(percentComplete(g))}%</span>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: MyGoal }) {
  const progress = percentComplete(goal);
  const left = daysLeft(goal.targetDate);
  return (
    <Link href={`/goals/${goal.id}`} className="card group p-4 hover:bg-stone-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-ink group-hover:text-accent">{goal.title}</h3>
            <CategoryBadge category={goal.category} />
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            {goal.currentValue} / {goal.targetValue} {goal.unit}
            {goal.targetDate && <> · due {formatDate(goal.targetDate)}</>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-accent">
          {progress}%
        </div>
      </div>
      <Progress value={progress} className="mt-3 w-full" />
      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-stone-500">
        <span className="inline-flex items-center gap-1">
          <Flame size={14} className={goal.streakDays > 0 ? "text-orange-500" : "text-stone-300"} />
          {goal.streakDays} day streak
        </span>
        {left !== null && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} />
            {left >= 0 ? `${left} days left` : `${Math.abs(left)} days overdue`}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-accent">
          Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function RequestCard({ r }: { r: { partnershipId: string; goalTitle: string; requester: User | null; createdAt: number } }) {
  const qc = useQueryClient();
  const respond = useMutation({
    mutationFn: (status: "accepted" | "declined") => api.respondToPartnership(r.partnershipId, status),
    onSuccess: (_data, status) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["my-goals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      if (status === "accepted") toast.success("You're partners now. Say hi in messages!");
      else toast.info("Request declined.");
    },
    onError: (e: any) => toast.error(e.message ?? "Something went wrong."),
  });
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <Avatar name={r.requester?.name ?? "?"} url={r.requester?.avatarUrl} size={40} />
        <div>
          <p className="text-sm font-bold text-ink">{r.requester?.name} wants to partner</p>
          <p className="text-xs text-stone-500">
            on “{r.goalTitle}” · {timeAgo(r.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:ml-auto">
        <button onClick={() => respond.mutate("declined")} disabled={respond.isPending} className="btn-ghost px-3 py-1.5">
          Decline
        </button>
        <button onClick={() => respond.mutate("accepted")} disabled={respond.isPending} className="btn-primary px-3 py-1.5">
          Accept
        </button>
      </div>
    </Card>
  );
}

function ActivityRow({ a }: { a: ActivityItem }) {
  const icons = { checkin: "✅", goal: "🎯", partnership: "🤝" } as const;
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-base">{icons[a.type]}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">
          <span className="font-bold">{a.userName || "You"}</span> {a.label}
          {a.type !== "partnership" && a.goalTitle && (
            <span className="text-stone-500"> · {a.goalTitle}</span>
          )}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-stone-400">{timeAgo(a.createdAt)}</span>
      </span>
      {a.type === "checkin" && a.userAvatarUrl !== null && a.userName !== "" && <Avatar name={a.userName} url={a.userAvatarUrl} size={24} />}
      {a.type === "partnership" && a.userName && <Avatar name={a.userName} url={a.userAvatarUrl} size={24} />}
    </li>
  );
}

function Skeleton() {
  return <div className="h-28 animate-pulse rounded-2xl bg-stone-900/5" />;
}