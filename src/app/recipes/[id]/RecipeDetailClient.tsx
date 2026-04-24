"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ClipboardList,
  ExternalLink,
  ListChecks,
  MoreHorizontal,
  PenLine,
  Play,
  Plus,
  Minus,
  Share2,
  ShoppingBasket,
  Youtube,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ---------- Helpers ----------
function prettyAmount(v: number | null): string {
  if (v === null) return "適量";
  if (v < 0.1) return "少々";
  const fractions: [number, string][] = [
    [1 / 8, "1/8"],
    [1 / 6, "1/6"],
    [1 / 4, "1/4"],
    [1 / 3, "1/3"],
    [1 / 2, "1/2"],
    [2 / 3, "2/3"],
    [3 / 4, "3/4"],
  ];
  const int = Math.floor(v);
  const frac = v - int;
  if (frac > 0.02 && frac < 0.98) {
    let best: string | null = null;
    let bestDiff = Infinity;
    for (const [f, s] of fractions) {
      const d = Math.abs(frac - f);
      if (d < bestDiff) {
        bestDiff = d;
        best = s;
      }
    }
    if (bestDiff < 0.06 && best) {
      return int > 0 ? `${int}と${best}` : best;
    }
  }
  return (Math.round(v * 10) / 10).toString();
}

function timeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

import CookingModeOverlay from "@/components/CookingModeOverlay";

// ---------- Component ----------
export default function RecipeDetailClient({ recipe, sortedSteps }: { recipe: any; sortedSteps: any[] }) {
  const router = useRouter();
  const [servings, setServings] = useState<number>(recipe.base_servings || 2);
  const [checkedIng, setCheckedIng] = useState<Set<number>>(new Set());
  const [checkedStep, setCheckedStep] = useState<Set<number>>(new Set());
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);

  const scaledIngredients = useMemo(
    () =>
      recipe.ingredients.map((ing: any) => ({
        ...ing,
        scaled: ing.amount_value === null ? null : (ing.amount_value / (recipe.base_servings || 1)) * servings,
      })),
    [recipe.ingredients, servings, recipe.base_servings]
  );

  const adjust = (delta: number) =>
    setServings((s) => Math.min(20, Math.max(1, s + delta)));

  const toggleSet = (set: Set<number>, idx: number) => {
    const next = new Set(set);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return next;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/recipes/${recipe.id}`;
    if (navigator.share) {
      await navigator.share({ title: recipe.title, url }).catch(console.error);
    } else {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    }
  };

  const copyShoppingList = async () => {
    const list = `【${recipe.title} ${servings}人分】\n` + scaledIngredients.map(ing => 
      `- ${ing.name} ${prettyAmount(ing.scaled)}${ing.unit || ''}`
    ).join('\n');
    await navigator.clipboard.writeText(list);
    alert('買い物リストをコピーしました');
  };

  const imageUrl = recipe.image_url?.startsWith('https') 
    ? recipe.image_url 
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}`;

  const isYouTube = recipe.source_url?.includes('youtube.com') || recipe.source_url?.includes('youtu.be');
  const tags = recipe.recipe_tags?.map((rt: any) => rt.tags.name) || [];

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-32">        {/* Mobile Spacing for Sticky Header */}
        <div className="pt-4 md:pt-8" />

        {/* Hero */}
        <section className="mt-4 grid md:grid-cols-[minmax(0,1fr)_340px] gap-6 md:gap-8 items-start">
          {/* Image */}
          <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden bg-cream-200">
            {recipe.image_url ? (
              <img
                src={imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-ink-500 gap-2">
                <ShoppingBasket className="w-8 h-8 opacity-50" />
                <span>画像なし</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent md:hidden" />
            <div className="absolute top-3 right-3 flex gap-2 md:hidden">
              <button
                aria-label="共有"
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex place-items-center justify-center shadow-soft"
              >
                <Share2 className="w-4 h-4 text-ink-700" />
              </button>
            </div>
          </div>

          {/* Meta */}
          <aside className="md:sticky md:top-24 space-y-5">
            <div className="space-y-2">
              <h1 className="text-[28px] sm:text-[34px] md:text-[36px] font-black tracking-tight leading-[1.2]">
                {recipe.title}
              </h1>
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-1 text-xs text-ink-500 hover:text-ink-900 group"
                >
                  {isYouTube ? (
                    <span className="relative w-6 h-6 rounded overflow-hidden bg-ink-900 flex place-items-center justify-center">
                      <Youtube className="w-4 h-4 text-white" />
                    </span>
                  ) : (
                    <span className="relative w-6 h-6 rounded overflow-hidden bg-cream-200 flex place-items-center justify-center">
                      <ExternalLink className="w-3 h-3 text-ink-700" />
                    </span>
                  )}
                  <span>{isYouTube ? '出典: YouTube' : new URL(recipe.source_url).hostname}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </a>
              )}
            </div>

            {/* Meta pills */}
            <div className="grid grid-cols-3 gap-2">
              {recipe.minutes != null && <MetaPill label="調理時間" value={recipe.minutes} unit="分" />}
              {recipe.difficulty != null && <MetaPill label="難易度" value={recipe.difficulty} />}
              <MetaPill label="分量" value={servings} unit="人分" />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t: string) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full bg-white ring-1 ring-line text-[12px] font-medium text-ink-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                className="flex-1 h-11 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-semibold shadow-cta inline-flex items-center justify-center gap-1.5 transition"
              >
                <PenLine className="w-4 h-4" />
                <span>編集</span>
              </button>
              <IconButton label="共有" onClick={handleShare}>
                <Share2 className="w-4 h-4 text-ink-700" />
              </IconButton>
              <IconButton label="その他" onClick={() => {}}>
                <MoreHorizontal className="w-4 h-4 text-ink-700" />
              </IconButton>
            </div>
          </aside>
        </section>

        <div className="mt-10 md:mt-14 grid lg:grid-cols-[380px_minmax(0,1fr)] gap-10 items-start">
          {/* ======== Ingredients ======== */}
          <section>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight inline-flex items-center gap-2">
                <ShoppingBasket className="w-5 h-5 text-forest-500" />
                <span>材料</span>
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                数字は人数に合わせて自動調整されます
              </p>
            </div>
            <ServingsStepper
              servings={servings}
              onAdjust={adjust}
              layout="pill"
            />
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-line overflow-hidden">
            <ul className="divide-y divide-line">
              {scaledIngredients.map((ing: any, i: number) => {
                const checked = checkedIng.has(i);
                return (
                  <li key={i}>
                    <button
                      onClick={() => setCheckedIng((s) => toggleSet(s, i))}
                      className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-cream-50 transition text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex place-items-center justify-center shrink-0 transition border ${
                          checked
                            ? "bg-coral-500 border-coral-500"
                            : "border-ink-300"
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                      </span>
                      <span
                        className={`flex-1 text-[15px] font-medium ${
                          checked
                            ? "text-ink-300 line-through"
                            : "text-ink-900"
                        }`}
                      >
                        {ing.name}
                      </span>
                      <span
                        className={`tnum text-[15px] font-semibold ${
                          checked
                            ? "text-ink-300 line-through"
                            : "text-ink-900"
                        }`}
                      >
                        {prettyAmount(ing.scaled)}
                        <span className="text-ink-500 font-medium ml-0.5 text-[13px]">
                          {ing.unit}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-3 flex justify-end">
            <button 
              onClick={copyShoppingList}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white ring-1 ring-line hover:bg-cream-100 text-sm text-ink-700 transition"
            >
              <ClipboardList className="w-4 h-4" />
              <span>買い物リストにコピー</span>
            </button>
          </div>
        </section>

          {/* ======== Steps ======== */}
          <section className="mt-4 lg:mt-0">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight inline-flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-forest-500" />
                <span>手順</span>
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                完了したステップはタップで打ち消せます
              </p>
            </div>
            <button 
              onClick={() => setIsCookingModeOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white ring-1 ring-line hover:bg-cream-100 text-sm font-medium text-ink-700 transition"
            >
              <Play className="w-4 h-4" />
              <span>調理モード</span>
            </button>
          </div>

          <ol className="space-y-3">
            {sortedSteps.map((s: any, i: number) => {
              const checked = checkedStep.has(i);
              // Simple extraction of time like mm:ss or hh:mm:ss if present in text
              const timeMatch = s.instruction.match(/((?:\d{1,2}:)?\d{1,2}:\d{2})/);
              const timeStr = timeMatch ? timeMatch[1] : null;

              return (
                <li
                  key={s.id}
                  className="rounded-2xl bg-white ring-1 ring-line overflow-hidden"
                >
                  <button
                    onClick={() => setCheckedStep((st) => toggleSet(st, i))}
                    className="w-full flex gap-4 p-4 sm:p-5 hover:bg-cream-50 transition text-left"
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-lg flex place-items-center justify-center text-sm font-bold tnum text-white transition ${
                        checked ? "bg-ink-300" : "bg-coral-500"
                      }`}
                    >
                      {s.step_number}
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p
                        className={`text-[15px] leading-[1.75] transition ${
                          checked
                            ? "text-ink-300 line-through"
                            : "text-ink-700 font-medium"
                        }`}
                      >
                        {s.instruction}
                      </p>
                      {timeStr && isYouTube && (
                        <a 
                          href={`${recipe.source_url}&t=${timeToSeconds(timeStr)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-coral-600 hover:text-coral-700"
                        >
                          <Play className="w-3 h-3" />
                          <span className="tnum">動画の {timeStr} から</span>
                        </a>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
        </div>

        <div className="h-10" />
      </main>

      {/* ======== Sticky mobile bottom bar ======== */}
      <div
        className="fixed bottom-0 inset-x-0 z-20 md:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-3 mb-3 rounded-2xl bg-white/95 backdrop-blur border border-line shadow-soft p-2 flex items-center gap-2">
          <ServingsStepper servings={servings} onAdjust={adjust} layout="bar" />
          <button 
            onClick={() => setIsCookingModeOpen(true)}
            className="h-11 px-4 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold shadow-cta inline-flex items-center gap-1.5 transition"
          >
            <Play className="w-4 h-4" />
            <span>調理開始</span>
          </button>
        </div>
      </div>

      <CookingModeOverlay 
        isOpen={isCookingModeOpen}
        onClose={() => setIsCookingModeOpen(false)}
        recipe={{ title: recipe.title, image_url: recipe.image_url }}
        steps={sortedSteps.map((s: any) => ({ id: s.id, text: s.instruction }))}
      />
    </div>
  );
}

// ---------- Sub components ----------
function MetaPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-line p-3 flex flex-col gap-1">
      <span className="text-[10px] text-ink-500 font-medium">{label}</span>
      <span className="tnum text-lg font-semibold">
        {value}
        {unit && <span className="text-xs text-ink-500 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="h-11 w-11 rounded-xl bg-white ring-1 ring-line hover:bg-cream-100 flex place-items-center justify-center transition"
    >
      {children}
    </button>
  );
}

function ServingsStepper({
  servings,
  onAdjust,
  layout,
}: {
  servings: number;
  onAdjust: (delta: number) => void;
  layout: "pill" | "bar";
}) {
  const isBar = layout === "bar";
  return (
    <div
      className={
        isBar
          ? "flex items-center gap-0 flex-1 rounded-xl bg-cream-50 p-1"
          : "flex items-center gap-0 rounded-full bg-white ring-1 ring-line p-1"
      }
    >
      <button
        onClick={() => onAdjust(-1)}
        aria-label="減らす"
        className={
          isBar
            ? "w-9 h-9 flex place-items-center justify-center rounded-lg hover:bg-white text-ink-700 transition"
            : "w-9 h-9 flex place-items-center justify-center rounded-full hover:bg-cream-100 text-ink-700 transition"
        }
      >
        <Minus className="w-4 h-4" />
      </button>
      <div
        className={
          isBar
            ? "flex-1 text-center tnum"
            : "px-3 min-w-[84px] text-center tnum"
        }
      >
        <span className="text-base font-semibold">{servings}</span>
        <span className="text-xs text-ink-500 ml-0.5">人分</span>
      </div>
      <button
        onClick={() => onAdjust(1)}
        aria-label="増やす"
        className={
          isBar
            ? "w-9 h-9 flex place-items-center justify-center rounded-lg hover:bg-white text-ink-700 transition"
            : "w-9 h-9 flex place-items-center justify-center rounded-full hover:bg-cream-100 text-ink-700 transition"
        }
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
