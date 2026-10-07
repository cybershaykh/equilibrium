"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, Compass, LayoutDashboard, MessageSquareText, Sparkles, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { api, timeAgo } from "@/lib/api";
import { Avatar } from "@/components/ui";
import type { User } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { href: "/discover", label: "Discover", icon: Compass, testId: "nav-discover" },
  { href: "/messages", label: "Messages", icon: MessageSquareText, testId: "nav-messages" },
  { href: "/how-it-works", label: "How it works", icon: Sparkles, testId: "nav-how-it-works" },
];

export function AppNav({ user }: { user: User }) {
  const pathname = usePathname();
  const qc = useQueryClient();

  const { data: notif } = useQuery({ queryKey: ["notifications"], queryFn: () => api.notifications(), refetchInterval: 30000 });

  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markRead = useMutation({
    mutationFn: (ids?: string[]) => api.markNotificationsRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const logout = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      toast.success("See you tomorrow. Keep your promise.");
      window.location.href = "/login";
    },
  });

  const unread = notif?.unread ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-paper/85 backdrop-blur">
      <div ref={wrapRef} className="mx-auto flex max-w-3xl flex-wrap items-center gap-1 px-4 py-2.5">
        <Link href="/" data-testid="link-home" className="mr-1 flex items-center gap-1.5">
          <span className="accent-font text-2xl font-bold leading-none text-ink">Equilibrium</span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 pt-1 sm:order-none sm:ml-4 sm:w-auto sm:pb-0 sm:pt-0">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                className={`navlink ${active ? "navlink-active" : ""}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/goals/new" data-testid="btn-new-goal" className="btn-primary px-3 py-1.5">
            <Plus size={16} />
            <span className="hidden sm:inline">New goal</span>
          </Link>

          <div className="relative">
            <button
              data-testid="btn-notifications"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-xl border border-stone-900/10 bg-white p-2 text-stone-600 hover:bg-stone-50"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-stone-900/10 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-900/5 px-4 py-3">
                  <span className="text-sm font-bold text-ink">Notifications</span>
                  {unread > 0 && (
                    <button onClick={() => markRead.mutate(undefined)} className="text-xs font-semibold text-accent hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!notif || notif.notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-stone-500">You&apos;re all caught up.</p>
                  ) : (
                    notif.notifications.map((n) => (
                      <NotificationRow key={n.id} n={n} markRead={markRead.mutate} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              data-testid="user-avatar"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full border border-stone-900/10"
              aria-label="Account menu"
            >
              <Avatar name={user.name} url={user.avatarUrl} size={34} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-stone-900/10 bg-white p-1.5 shadow-xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-bold text-ink">{user.name}</p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
                <button
                  onClick={() => logout.mutate()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationRow({
  n,
  markRead,
}: {
  n: { id: string; type: string; title: string; body: string; read: boolean; createdAt: number };
  markRead: (ids?: string[]) => void;
}) {
  const icon =
    n.type === "partnership_request" ? "🤝" : n.type === "partnership_accepted" ? "🎉" : n.type === "message" ? "💬" : "✅";
  return (
    <button
      onClick={() => markRead([n.id])}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-stone-50 ${n.read ? "" : "bg-accent-soft/40"}`}
    >
      <span className="mt-0.5 text-base">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-ink">{n.title}</span>
        <span className="block text-xs text-stone-500">{n.body}</span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-stone-400">{timeAgo(n.createdAt)}</span>
      </span>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </button>
  );
}