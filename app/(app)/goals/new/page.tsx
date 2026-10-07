"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";
import { GOAL_CATEGORIES } from "@/lib/types";

export default function NewGoalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    category: "Wellbeing",
    targetDate: "",
    targetValue: 100,
    unit: "%",
    detail: "",
    currentValue: 0,
    seekingPartner: true,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createGoal({
        ...form,
        targetValue: Number(form.targetValue),
        currentValue: Number(form.currentValue),
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
      }),
    onSuccess: (data) => {
      toast.success("Goal created successfully!");
      router.push(`/goals/${data.goal.id}`);
      router.refresh();
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create goal."),
  });

  const set = (key: keyof typeof form, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="link inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} /> Back to my space
      </Link>

      <section>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
          <Target size={22} className="text-accent" /> Post your goal
        </h1>
        <p className="text-sm text-stone-500">The Intention. Be honest, be specific — measurable beats vague.</p>
      </section>

      <Card>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div>
            <label className="label" htmlFor="title">Goal title</label>
            <input
              id="title"
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              data-testid="input-title"
              className="input"
              placeholder="e.g. Run 5k three times a week"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                data-testid="select-category"
                className="input"
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="targetDate">Target date</label>
              <input
                id="targetDate"
                type="date"
                value={form.targetDate}
                onChange={(e) => set("targetDate", e.target.value)}
                data-testid="input-date"
                className="input"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="targetValue">Target value</label>
              <input
                id="targetValue"
                type="number"
                min={1}
                step="any"
                required
                value={form.targetValue}
                onChange={(e) => set("targetValue", e.target.value)}
                data-testid="input-target-value"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="unit">Unit</label>
              <input
                id="unit"
                required
                maxLength={12}
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                data-testid="input-unit"
                className="input"
                placeholder="%, km, books…"
              />
            </div>
            <div>
              <label className="label" htmlFor="currentValue">Current value</label>
              <input
                id="currentValue"
                type="number"
                min={0}
                step="any"
                value={form.currentValue}
                onChange={(e) => set("currentValue", e.target.value)}
                data-testid="input-current"
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="detail">Detail / why it matters (optional)</label>
            <textarea
              id="detail"
              rows={3}
              maxLength={600}
              value={form.detail}
              onChange={(e) => set("detail", e.target.value)}
              data-testid="input-detail"
              className="input resize-none"
              placeholder="What does showing up look like? What will you do every day?"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-900/10 bg-white p-3.5 hover:bg-stone-50">
            <input
              type="checkbox"
              checked={form.seekingPartner}
              onChange={(e) => set("seekingPartner", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1f6f54]"
            />
            <span>
              <span className="block text-sm font-bold text-ink">Seek an accountability partner</span>
              <span className="block text-xs text-stone-500">
                Appear in Discover so someone working on the same goal can partner up with you.
              </span>
            </span>
          </label>

          <button type="submit" disabled={create.isPending} data-testid="btn-submit" className="btn-primary">
            <Plus size={16} />
            {create.isPending ? "Posting…" : "Post goal"}
          </button>
        </form>
      </Card>
    </div>
  );
}