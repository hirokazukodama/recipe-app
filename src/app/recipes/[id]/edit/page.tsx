import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import RecipeEditForm from "./RecipeEditForm";

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  // 編集に必要なデータをすべて取得
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

  return <RecipeEditForm initialRecipe={recipe} />;
}
