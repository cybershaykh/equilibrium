import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session.userId ? findUserById(session.userId) : null;
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppNav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6 pb-24 sm:py-8">{children}</main>
    </div>
  );
}