"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Handshake, Flame, ArrowRight, Compass, Check, Hourglass } from "lucide-react";
import { api, timeAgo } from "@/lib/api";
import { Card, Progress, CategoryBadge, Avatar, EmptyState } from "@/components/ui";
import type { FeedItem } from "@/lib/types";
import { GOAL_CATEGORIES } from "@/lib/types";

export default function DiscoverPage() {
  const [category, setCategory] = useState<string>("All");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const qc = useQueryClient();

  const feed = useQuery({
    queryKey: ["feed", category, debounced],
    queryFn: () => api.feed(category === "All" ? undefined : category, debounced || undefined),
  });

  const request = useMutation({
    mutationFn: ({ goalId, recipientId }: { goalId: string; recipientId: string }) =>
      api.requestPartnership(goalId, recipientId),
    onSuccess: () => {
      toast.success("Partnership request sent!");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send request."),
  });

  const goals = feed.data?.goals ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h1 className="text-2xl font-extrabold text-ink">Discover</h1>
        <p className="text-sm text-stone-500">Goals seeking a partner right now. Someone out there wants to show up with you.</p>
      </section>

      <section className="flex flex-col gap-2 sm:flex-row sm:items-center" data-testid="discover-filters">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <Search size={16} />
          </span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setDebounced(e.target.value);
            }}
            data-testid="input-search"
            className="input pl-9"
            placeholder="Search goals..."
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          {["All", ...GOAL_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === c
                  ? "border-ink bg-ink text-white"
                  : "border-stone-900/10 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {feed.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-stone-900/5" />}

      {!feed.isLoading && goals.length === 0 && (
        <EmptyState
          icon={<Compass size={26} />}
          title="No goals seeking partners right now"
          body="Try another category or check back later. Your own goal might be just what someone's looking for."
        />
      )}

      <section className="flex flex-col gap-3">
        {goals.map((g) => (
          <DiscoverCard key={g.id} goal={g} onRequest={() => request.mutate({ goalId: g.id, recipientId: g.userId })} requesting={request.isPending} />
        ))}
      </section>
    </div>
  );
}

function DiscoverCard({
  goal,
  onRequest,
  requesting,
}: {
  goal: FeedItem;
  onRequest: () => void;
  requesting: boolean;
}) {
  const button = goal.myRequest ? (
    <span className="badge border border-amber-600/30 bg-amber-50 text-amber-700">
      <Hourglass size={13} /> Request pending
    </span>
  ) : (
    <button onClick={onRequest} disabled={requesting} data-testid="btn-request-partner" className="btn-primary px-3 py-1.5">
      {requesting ? "Sending…" : (
        <>
          <Handshake size={15} /> Request partnership
        </>
      )}
    </button>
  );

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-ink">{goal.title}</h3>
            <CategoryBadge category={goal.category} />
          </div>
          {goal.detail && <p className="mt-1 text-sm text-stone-500 line-clamp-2">{goal.detail}</p>}
        </div>
        {button}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <Avatar name={goal.owner.name} url={goal.owner.avatarUrl} size={28} />
          {goal.owner.name}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
          <Flame size={13} className={goal.streak > 0 ? "text-orange-500" : "text-stone-300"} />
          {goal.streak}d
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs font-bold text-ink">
        <span>
          {goal.currentValue} / {goal.targetValue} {goal.unit}
        </span>
        <span className="text-accent">{goal.progress}%</span>
        <Progress value={goal.progress} className="flex-1" />
      </div>

      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>Posted {timeAgo(goal.createdAt)}</span>
        <Link href={`/goals/${goal.id}`} className="link inline-flex items-center gap-1">
          Details <ArrowRight size={12} />
        </Link>
      </div>
    </Card>
  );
}