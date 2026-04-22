import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./recipe-detail.module.css";
import { 
  ArrowLeft, 
  Utensils, 
  ListChecks, 
  Tag as TagIcon, 
  ExternalLink,
  Users,
  Edit2,
  Trash2
} from "lucide-react";
import RecipeControls from "./RecipeControls";
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
    <div className="container">
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          一覧へ戻る
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{recipe.title}</h1>
          <div className={styles.headerMeta}>
            {recipe.source_url && (
              <a 
                href={recipe.source_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.sourceBadge}
              >
                <ExternalLink size={14} />
                {new URL(recipe.source_url).hostname}
              </a>
            )}
            <RecipeControls recipeId={recipe.id} />
          </div>

          <div className={styles.mainContent}>
            <div className={styles.imageSection}>
              <div className={styles.imageWrapper}>
                {recipe.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={recipe.image_url.startsWith('https') 
                      ? recipe.image_url 
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}`} 
                    alt={recipe.title} 
                    className={styles.recipeImage}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>画像なし</div>
                )}
              </div>

              <div className={styles.tagSection}>
                <div className={styles.tagList}>
                  {recipe.recipe_tags?.map((rt: any) => (
                    <span key={rt.tags.id} className={styles.tag}>
                      #{rt.tags.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <RecipeDetailClient recipe={recipe} sortedSteps={sortedSteps} />
          </div>
        </header>
      </div>
    </div>
  );
}
