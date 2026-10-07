"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { api, timeAgo } from "@/lib/api";
import { Avatar } from "@/components/ui";
import type { Message, User } from "@/lib/types";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const partnershipId = params.id;
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", partnershipId],
    queryFn: () => api.messages(partnershipId),
    refetchInterval: 4000,
  });

  const messages = (data?.messages ?? []) as Message[];
  const other = data?.other as User | null | undefined;
  const goal = data?.goal;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const send = useMutation({
    mutationFn: () => api.sendMessage(partnershipId, draft),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages", partnershipId] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send message."),
  });

  if (isLoading && !data) return <div className="h-64 animate-pulse rounded-2xl bg-stone-900/5" />;

  if (!data) {
    return (
      <div className="card p-8 text-center text-sm text-stone-500">
        This conversation isn&apos;t available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/messages" className="link inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} /> Conversations
      </Link>

      <div className="card flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-stone-900/10 p-4">
          <Avatar name={other?.name ?? "?"} url={other?.avatarUrl} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{other?.name}</p>
            <p className="truncate text-xs text-stone-500">Partner on “{goal?.title ?? "a goal"}”</p>
          </div>
        </div>

        <div className="flex max-h-[55vh] min-h-[320px] flex-col gap-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="m-auto text-center text-sm text-stone-400">
              No messages yet. Break the ice — share today&apos;s win or ask how their goal is going.
            </p>
          ) : (
            messages.map((m) => (
              <Bubble key={m.id} m={m} me={m.senderId !== other?.id} />
            ))
          )}
          <div ref={endRef} />
        </div>

        <form
          className="flex items-center gap-2 border-t border-stone-900/10 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) send.mutate();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            data-testid="input-message"
            className="input flex-1"
            placeholder="Write a message…"
          />
          <button type="submit" disabled={send.isPending || !draft.trim()} data-testid="btn-send" className="btn-primary px-3.5 py-2.5">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ m, me }: { m: Message; me: boolean }) {
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          me ? "bg-accent text-white rounded-br-sm" : "bg-stone-100 text-ink rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{m.content}</p>
        <p className={`mt-0.5 text-right text-[10px] ${me ? "text-white/70" : "text-stone-400"}`}>
          {timeAgo(m.createdAt)}
        </p>
      </div>
    </div>
  );
}