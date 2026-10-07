"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Flame,
  CalendarDays,
  Handshake,
  Trash2,
  CheckCircle2,
  Pause,
  PlayCircle,
  Pencil,
  MessageSquare,
  Hourglass,
  Send,
} from "lucide-react";
import { api, timeAgo, formatDate } from "@/lib/api";
import { Card, Progress, CategoryBadge, Avatar, EmptyState } from "@/components/ui";
import type { Checkin as CheckinRow, GoalDetail } from "@/lib/types";
import { GOAL_CATEGORIES } from "@/lib/types";

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const goalId = params.id;
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["goal", goalId],
    queryFn: () => api.goal(goalId),
  });

  const goal = data?.goal;
  const checkins = (data?.checkins ?? []) as CheckinRow[];

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goal", goalId] });
    qc.invalidateQueries({ queryKey: ["my-goals"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["activity"] });
  };

  const checkin = useMutation({
    mutationFn: () => api.checkin(goalId, Number(amount) || 0, note),
    onSuccess: () => {
      toast.success("Checked in successfully!");
      setAmount("");
      setNote("");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Could not check in."),
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => api.updateGoal(goalId, { status }),
    onSuccess: (res: any) => {
      const s = (res.goal ?? res.updatedGoal)?.status;
      toast.success(
        s === "completed" ? "Goal completed — huge win!" : s === "paused" ? "Goal paused." : "Goal resumed."
      );
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Could not update."),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteGoal(goalId),
    /* eslint-disable no-alert */
    onSuccess: () => {
      toast.success("Goal deleted.");
      qc.invalidateQueries({ queryKey: ["my-goals"] });
      router.push("/");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not delete."),
  });

  if (isLoading && !goal) return <div className="h-64 animate-pulse rounded-2xl bg-stone-900/5" />;

  if (!goal) {
    return (
      <EmptyState
        icon={<ArrowLeft size={24} />}
        title="Goal not found"
        body="It may have been deleted."
        action={
          <Link href="/" className="btn-ghost">
            Back to dashboard
          </Link>
        }
      />
    );
  }

  const activePartner = goal.partnerships?.find((p) => p.status === "accepted");

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="link inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-ink">{goal.title}</h1>
              <CategoryBadge category={goal.category} />
              {goal.status !== "active" && (
                <span className="stamp border-orange-600/40 text-orange-700">{goal.status}</span>
              )}
            </div>
            {goal.detail && <p className="mt-1.5 max-w-lg text-sm text-stone-500">{goal.detail}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Avatar name={goal.owner.name} url={goal.owner.avatarUrl} size={22} />
                {goal.meIsOwner ? "You" : goal.owner.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flame size={14} className={goal.streak > 0 ? "text-orange-500" : "text-stone-300"} />
                {goal.streak} day streak
              </span>
              {goal.targetDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {formatDate(goal.targetDate)}
                  {goal.daysLeft !== null && goal.daysLeft >= 0 && ` · ${goal.daysLeft} days left`}
                </span>
              )}
            </div>
          </div>
          {goal.meIsOwner && (
            <button onClick={() => setEditing((v) => !v)} data-testid="btn-edit" className="btn-ghost px-3 py-1.5">
              <Pencil size={14} /> {editing ? "Done" : "Edit"}
            </button>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-ink">
            <span className="font-mono tabular-nums">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
            <span className="text-accent">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="w-full" />
        </div>
      </section>

      <PartnerSection goal={goal as GoalDetail} goalId={goalId} />

      {goal.meIsOwner && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Post a check-in</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="progress">Progress added ({goal.unit})</label>
              <input
                id="progress"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-progress"
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label" htmlFor="note">Note (optional)</label>
              <input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                data-testid="input-note"
                className="input"
                placeholder="Add a note"
              />
            </div>
          </div>
          <button onClick={() => checkin.mutate()} disabled={checkin.isPending} data-testid="btn-checkin" className="btn-primary w-fit">
            <Send size={15} /> {checkin.isPending ? "Posting…" : "Post check-in"}
          </button>
        </Card>
      )}

      {editing && goal.meIsOwner && <EditForm goal={goal as GoalDetail} goalId={goalId} onDone={invalidate} />}

      <CheckinSection checkins={checkins} />

      {goal.meIsOwner && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {goal.status === "active" && (
              <button onClick={() => setStatus.mutate("paused")} className="btn-ghost px-3 py-1.5">
                <Pause size={14} /> Pause
              </button>
            )}
            {goal.status === "paused" && (
              <button onClick={() => setStatus.mutate("active")} className="btn-ghost px-3 py-1.5">
                <PlayCircle size={14} /> Resume
              </button>
            )}
            {goal.status !== "completed" && (
              <button onClick={() => setStatus.mutate("completed")} className="btn-ghost px-3 py-1.5 text-emerald-700">
                <CheckCircle2 size={14} /> Mark complete
              </button>
            )}
          </div>
          <button
            onClick={() => {
              if (window.confirm("Delete this goal and its check-ins?")) remove.mutate();
            }}
            className="btn-danger px-3 py-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </Card>
      )}

      {activePartner && (
        <Link href={`/messages/${activePartner.id}`} data-testid="btn-message-partner" className="btn-ghost w-fit">
          <MessageSquare size={15} /> Open the conversation
        </Link>
      )}
    </div>
  );
}

function PartnerSection({ goal, goalId }: { goal: GoalDetail; goalId: string }) {
  const qc = useQueryClient();

  const active = goal.partnerships?.find((p) => p.status === "accepted");
  const incoming = goal.partnerships?.find((p) => p.status === "pending" && !p.userMe);
  const outgoing = goal.partnerships?.find((p) => p.status === "pending" && p.userMe);

  const respond = useMutation({
    mutationFn: (status: "accepted" | "declined") => api.respondToPartnership(incoming?.id ?? "", status),
    onSuccess: (_d, status) => {
      toast.success(status === "accepted" ? "You're partners now — say hi in messages!" : "Request declined.");
      qc.invalidateQueries({ queryKey: ["goal", goalId] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not respond."),
  });

  if (!goal.meIsOwner) {
    return (
      <Card className="text-sm">
        <p className="font-bold text-ink">You&apos;re supporting this goal</p>
        <p className="mt-1 text-stone-500">
          Cheer {goal.owner.name} on and keep the momentum going. Your check-ins on your own goals build a shared
          streak.
        </p>
      </Card>
    );
  }

  let body: React.ReactNode = null;

  if (active) {
    body = (
      <div className="flex items-center gap-3">
        <Avatar name={active.otherUser?.name ?? "Partner"} url={active.otherUser?.avatarUrl} size={40} />
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">{active.otherUser?.name} is your accountability partner</p>
          <p className="text-xs text-stone-500">You show up for each other. Keep the streak alive.</p>
        </div>
        <Link href={`/messages/${active.id}`} className="btn-primary px-3 py-1.5">
          <MessageSquare size={15} /> Message
        </Link>
      </div>
    );
  } else if (incoming) {
    body = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Avatar name={incoming.otherUser?.name ?? "?"} url={incoming.otherUser?.avatarUrl} size={40} />
          <p className="text-sm font-bold text-ink">{incoming.otherUser?.name} wants to be your partner</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => respond.mutate("declined")} className="btn-ghost px-3 py-1.5">Decline</button>
          <button onClick={() => respond.mutate("accepted")} className="btn-primary px-3 py-1.5">Accept</button>
        </div>
      </div>
    );
  } else if (outgoing) {
    body = (
      <div className="flex items-center gap-3">
        <Hourglass size={18} className="text-amber-600" />
        <p className="text-sm font-semibold text-stone-600">
          Request sent — waiting for {goal.owner.name} to accept.
        </p>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">Solid goals need a witness.</p>
          <p className="text-sm text-stone-500">Post this to Discover and let a partner find you.</p>
        </div>
        <button
          onClick={() => {
            if (goal.seekingPartner) {
              toast.info("This goal already appears in Discover — a partner will request you.");
            } else {
              toast.info("Enable “Seek a partner” in the edit form to appear in Discover.");
            }
          }}
          className="btn-ghost w-fit px-3 py-1.5"
        >
          <Handshake size={15} /> Understand matching
        </button>
      </div>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
        <Handshake size={15} /> In your corner
      </h2>
      {body}
    </Card>
  );
}

function CheckinSection({ checkins }: { checkins: CheckinRow[] }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">Check-ins</h2>
      {checkins.length === 0 ? (
        <p className="text-sm text-stone-500">No check-ins yet. Show up — small steps count.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-900/5">
          {checkins
            .slice()
            .reverse()
            .map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2.5">
                <span className={`stamp mt-0.5 shrink-0 ${c.progress > 0 ? "border-accent/40 text-accent" : "border-stone-900/20 text-stone-500"}`}>
                  {c.progress > 0 ? `+${c.progress}` : "pulse"}
                </span>
                <span className="min-w-0 flex-1">
                  {c.note && <span className="block text-sm text-ink">{c.note}</span>}
                  <span className="text-[11px] uppercase tracking-wide text-stone-400">{timeAgo(c.createdAt)}</span>
                </span>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}

function EditForm({ goal, goalId, onDone }: { goal: GoalDetail; goalId: string; onDone: () => void }) {
  const [f, setF] = useState({
    title: goal.title,
    category: goal.category,
    targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : "",
    targetValue: String(goal.targetValue),
    unit: goal.unit,
    detail: goal.detail,
    seekingPartner: goal.seekingPartner,
  });
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: () =>
      api.updateGoal(goalId, {
        title: f.title,
        category: f.category,
        targetDate: f.targetDate ? new Date(f.targetDate).toISOString() : null,
        targetValue: Number(f.targetValue),
        unit: f.unit,
        detail: f.detail,
        seekingPartner: f.seekingPartner,
      }),
    onSuccess: () => {
      toast.success("Goal updated successfully!");
      onDone();
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save."),
  });

  void qc;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">Edit goal</h2>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="input" placeholder="Title" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="input">
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} className="input" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            min={1}
            step="any"
            value={f.targetValue}
            onChange={(e) => setF({ ...f, targetValue: e.target.value })}
            className="input"
            placeholder="Target value"
          />
          <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} className="input" placeholder="unit" />
        </div>
        <textarea value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} rows={2} maxLength={600} className="input resize-none" placeholder="Detail" />
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={f.seekingPartner} onChange={(e) => setF({ ...f, seekingPartner: e.target.checked })} className="h-4 w-4 accent-[#1f6f54]" />
          Seek an accountability partner in Discover
        </label>
        <button type="submit" disabled={save.isPending} data-testid="btn-submit" className="btn-primary w-fit">
          Save changes
        </button>
      </form>
    </Card>
  );
}