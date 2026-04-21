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
    <main className={styles.container}>
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={20} />
        レシピ一覧に戻る
      </Link>

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <div className={styles.servings}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} />
                {recipe.base_servings ? `${recipe.base_servings}人分` : '分量不明'}
              </div>
              {recipe.source_url && (
                <a 
                  href={recipe.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.sourceBadge}
                >
                  <ExternalLink size={14} />
                  元のサイトを見る
                </a>
              )}
            </div>
          </div>
          <RecipeControls recipeId={recipe.id} />
        </div>

        <div className={styles.headerMain}>
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
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-secondary)'
              }}>
                画像なし
              </div>
            )}
          </div>

          <div className={styles.tagArea}>
            <h3 className={styles.tagLabel}>
              <TagIcon size={16} />
              タグ
            </h3>
            <div className={styles.tagList}>
              {recipe.recipe_tags && recipe.recipe_tags.length > 0 ? (
                recipe.recipe_tags.map((rt: any) => (
                  <span key={rt.tags.id} className={styles.tag}>
                    {rt.tags.name}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>タグなし</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <RecipeDetailClient recipe={recipe} sortedSteps={sortedSteps} />
    </main>
  );
}
