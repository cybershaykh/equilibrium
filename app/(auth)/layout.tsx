import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session.userId ? findUserById(session.userId) : null;
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}