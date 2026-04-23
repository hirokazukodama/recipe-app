import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import RecipeDetailClient from "./RecipeDetailClient";

export default async function RecipePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  // すべての関連データを一度に取得
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(`
      *,
      ingredients (*),
      steps (*),
      recipe_tags (
        tags (id, name)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !recipe) {
    return notFound();
  }

  const sortedSteps = recipe.steps.sort((a: any, b: any) => a.step_number - b.step_number);

  return (
    <RecipeDetailClient recipe={recipe} sortedSteps={sortedSteps} />
  );
}
