import Link from "next/link";
import styles from "./page.module.css";
import { Plus, LogOut, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./auth/actions";
import RecipeDashboard from "@/components/RecipeDashboard";

export default function Home() {
  return (
    <div className="container">
      <AuthBoundContent />
    </div>
  );
}

async function AuthBoundContent() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={styles.landing}>
        <div className={styles.heroBadge}>AI Recipe Manager</div>
        <h1 className={styles.heroTitle}>
          お気に入りのレシピを<br />
          <span className="gradient-text">一瞬で「自分のもの」に。</span>
        </h1>
        <p className={styles.heroDescription}>
          URLを貼るだけで、AIが分量や手順をスマートに整理。<br />
          人数に合わせた自動計算も、スマホひとつで。
        </p>
        <div className={styles.heroActions}>
          <Link href="/auth/login" className={styles.primaryButton}>
            今すぐはじめる
          </Link>
        </div>
      </div>
    );
  }

  // ユーザーの全レシピを取得 (タグと画像含む)
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_tags(
        tags(id, name)
      )
    `)
    .order('created_at', { ascending: false });

  // 取得したレシピ一覧から利用されているタグを動的に抽出
  const allTags = Array.from(
    new Set(
      (recipes || []).flatMap(recipe => 
        recipe.recipe_tags?.map((rt: any) => rt.tags.name) || []
      )
    )
  );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <div style={{ flex: 1 }}></div>
        <form action={logout}>
          <button type="submit" className={styles.secondaryButton}>
            <LogOut size={16} /> 
            <span>ログアウト</span>
          </button>
        </form>
      </div>

      <RecipeDashboard 
        initialRecipes={(recipes as any) || []} 
        allTags={allTags} 
      />
    </div>
  );
}
