export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "#e8590c",
  "#1f6f54",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ca8a04",
  "#0d9488",
  "#dc2626",
  "#4f46e5",
  "#a21caf",
];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const CATEGORY_BADGES: Record<string, string> = {
  Wellbeing: "bg-emerald-100 text-emerald-800",
  Fitness: "bg-orange-100 text-orange-800",
  "Personal growth": "bg-violet-100 text-violet-800",
  Career: "bg-sky-100 text-sky-800",
  Creative: "bg-pink-100 text-pink-800",
};

export function categoryBadge(category: string) {
  return CATEGORY_BADGES[category] ?? "bg-stone-100 text-stone-700";
}