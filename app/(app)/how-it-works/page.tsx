import Link from "next/link";
import { Target, Handshake, MessageSquare, ArrowRight, Scale, Sparkles, Compass } from "lucide-react";
import { Card } from "@/components/ui";

const STEPS = [
  {
    icon: Target,
    step: "01",
    title: "The Intention",
    body: "Post a measurable goal — a target value, a unit, a date. Being honest and specific beats vague ambition.",
  },
  {
    icon: Compass,
    step: "02",
    title: "The Match",
    body: "Browse the discovery feed. When you find someone working on the same mountain, send a partnership request.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "The Action",
    body: "Once accepted, you become each other's anchor. Log your daily progress, check in, and build a shared streak.",
  },
  {
    icon: MessageSquare,
    step: "04",
    title: "Show up, together",
    body: "Use the messenger to share wins, admit struggles, and keep the momentum going. Accountability is renewable.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="card relative overflow-hidden p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
          <Scale size={26} />
        </div>
        <h1 className="accent-font mt-4 text-4xl font-bold text-ink">Equilibrium</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
          The quiet force behind every kept promise: a person on the other end, holding the same line.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/goals/new" className="btn-primary">
            Post your goal <ArrowRight size={15} />
          </Link>
          <Link href="/discover" className="btn-ghost">
            <Compass size={15} /> Discover partners
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Card key={s.step} className="relative overflow-hidden">
            <span className="accent-font absolute -right-2 -top-4 text-6xl text-stone-900/5">{s.step}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <s.icon size={20} />
            </div>
            <h2 className="mt-3 flex items-center gap-2 text-base font-bold text-ink">
              {s.title}
            </h2>
            <p className="mt-1 text-sm text-stone-500">{s.body}</p>
          </Card>
        ))}
      </section>

      <Card className="flex flex-col items-center gap-2 bg-brand-soft/40 py-8 text-center lg:flex-row lg:justify-center lg:gap-3">
        <Sparkles size={20} className="text-brand" />
        <p className="text-sm font-semibold text-ink">
          “A little progress is still progress. Keep your promise today.”
        </p>
      </Card>
    </div>
  );
}