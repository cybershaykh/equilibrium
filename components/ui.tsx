import type { ReactNode } from "react";
import { categoryBadge, avatarColor, initials } from "@/lib/format";

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, backgroundColor: avatarColor(name), fontSize: size * 0.42 }}
    >
      {initials(name)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return <span className={`badge ${categoryBadge(category)}`}>{category}</span>;
}

export function Progress({ value, className = "max-w-xs" }: { value: number; className?: string }) {
  return (
    <div className={`progress-track ${className}`}>
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-stone-900/15 bg-white/60 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">{icon}</div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-stone-500">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      <span className="text-3xl font-extrabold text-ink">{value}</span>
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </Card>
  );
}