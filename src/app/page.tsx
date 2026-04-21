import Link from "next/link";
import styles from "./page.module.css";
import { Plus, LogOut, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./auth/actions";
import RecipeDashboard from "@/components/RecipeDashboard";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.landing}>
        <h1 className={styles.title}>Recipe Auto-Importer</h1>
        <p className={styles.description}>
          テキストを貼り付けるだけで、AIがレシピを構造化して保存します。
          毎日の料理をよりスマートで効率的に。
        </p>

        <AuthBoundContent />
      </div>
    </main>
  );
}

async function AuthBoundContent() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={styles.buttonContainer}>
        <Link href="/auth/login" className={styles.primaryButton}>
          はじめる
        </Link>
      </div>
    );
  }

  // 1. ユーザーの全レシピを取得 (タグと画像含む)
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_tags(
        tags(id, name)
      )
    `)
    .order('created_at', { ascending: false });

  // 2. ユーザーが持っている全タグ名を取得 (フィルタリング用)
  const { data: tagsData } = await supabase
    .from('tags')
    .select('name')
    .eq('user_id', user.id);
  
  const allTags = Array.from(new Set((tagsData || []).map(t => t.name)));

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <div className={styles.dashboardHeader}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>マイレシピ</h2>
        <div className={styles.userActions}>
          <Link href="/import" className={styles.primaryButton}>
            <Plus size={18} /> レシピを追加
          </Link>
          <form action={logout}>
            <button type="submit" className={styles.secondaryButton}>
              <LogOut size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              ログアウト
            </button>
          </form>
        </div>
      </div>

      <RecipeDashboard 
        initialRecipes={(recipes as any) || []} 
        allTags={allTags} 
      />
    </div>
  );
}
