"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareText, Search } from "lucide-react";
import { api, timeAgo } from "@/lib/api";
import { Card, EmptyState, Avatar } from "@/components/ui";

export default function MessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: () => api.partners(),
    refetchInterval: 15000,
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h1 className="text-2xl font-extrabold text-ink">Messages</h1>
        <p className="text-sm text-stone-500">Your conversations — share wins, admit struggles, keep momentum.</p>
      </section>

      {isLoading && !data ? (
        <div className="h-40 animate-pulse rounded-2xl bg-stone-900/5" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText size={26} />}
          title="No conversations yet"
          body="Once someone accepts your partnership request, your conversations will appear here."
          action={
            <Link href="/discover" className="btn-primary">
              <Search size={16} /> Find a partner
            </Link>
          }
        />
      ) : (
        <section className="flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.partnershipId}
              href={`/messages/${c.partnershipId}`}
              className="card flex items-center gap-3 p-4 hover:bg-stone-50"
            >
              <Avatar name={c.partner?.name ?? "?"} url={c.partner?.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-ink">{c.partner?.name}</p>
                  {c.unread > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  ) : (
                    <span className="text-[11px] uppercase tracking-wide text-stone-400">{timeAgo(c.createdAt)}</span>
                  )}
                </div>
                <p className="truncate text-xs text-stone-500">{c.goalTitle}</p>
                <span className="badge mt-1 bg-brand-soft text-brand">{c.goalCategory}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}