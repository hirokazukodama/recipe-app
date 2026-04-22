import Link from "next/link";
import styles from "./page.module.css";
import { LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./auth/actions";
import RecipeDashboard from "@/components/RecipeDashboard";
import { getDetailedRecipes, getTags } from "@/actions/recipe";

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

  // 1. 初期データ（最初の12件）を取得
  const { data: recipes, hasMore, totalCount } = await getDetailedRecipes({ offset: 0, limit: 12 });

  // 2. フィルタ用の全タグ一覧を取得
  const allTags = await getTags();

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
        initialRecipes={recipes} 
        allTags={allTags} 
        initialHasMore={hasMore || false}
        totalCount={totalCount || 0}
      />
    </div>
  );
}
