import Link from "next/link";
import { LogOut, ArrowRight, Sparkles, ChefHat } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./auth/actions";
import RecipeDashboard from "@/components/RecipeDashboard";
import { getDetailedRecipes, getTags } from "@/actions/recipe";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-56px)]">
      <AuthBoundContent />
    </div>
  );
}

async function AuthBoundContent() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="relative overflow-hidden bg-cream-50 pt-20 pb-24 sm:pt-32 sm:pb-32">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-coral-100/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-forest-100/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-ink-900 leading-[1.1] mb-8">
            お気に入りのレシピを<br />
            <span className="bg-gradient-to-r from-coral-500 to-coral-600 bg-clip-text text-transparent">一瞬で「自分のもの」に。</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-ink-500 leading-relaxed mb-12">
            URLを貼るだけで、AIが分量や手順をスマートに整理。<br className="hidden sm:block" />
            人数に合わせた自動計算も、スマホひとつで。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth/signup" 
              className="w-full sm:w-auto h-14 px-10 inline-flex items-center justify-center rounded-2xl bg-ink-900 text-white text-lg font-bold hover:bg-ink-700 transition shadow-cta"
            >
              今すぐはじめる
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/auth/login" 
              className="w-full sm:w-auto h-14 px-10 inline-flex items-center justify-center rounded-2xl bg-white ring-1 ring-line text-lg font-bold text-ink-700 hover:bg-cream-100 transition shadow-soft"
            >
              ログイン
            </Link>
          </div>

          {/* Feature Grid placeholder for Premium feel */}
          <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            <FeatureItem 
              icon={<Sparkles className="w-6 h-6 text-coral-500" />}
              title="AI 構造化"
              description="どんな形式のレシピも、AIが正確に材料と手順へ変換します。"
            />
            <FeatureItem 
              icon={<ChefHat className="w-6 h-6 text-forest-500" />}
              title="人数調整"
              description="1人分から20人分まで、タップひとつで全ての分量を自動計算。"
            />
            <FeatureItem 
              icon={<Link 
                href="#"
                className="pointer-events-none"
              >
                <div className="w-6 h-6 rounded-full bg-ink-900 flex items-center justify-center text-white text-[10px] font-bold">Y</div>
              </Link>}
              title="YouTube 連携"
              description="動画内のタイムスタンプを検出し、調理中の特定シーンへジャンプ。"
            />
          </div>
        </div>
      </div>
    );
  }

  const { data: recipes, hasMore, totalCount } = await getDetailedRecipes({ offset: 0, limit: 12 });
  const allTags = await getTags();

  return (
    <div className="py-4">
      <RecipeDashboard 
        initialRecipes={recipes} 
        allTags={allTags} 
        initialHasMore={hasMore || false}
        totalCount={totalCount || 0}
      />
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/50 backdrop-blur ring-1 ring-line shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-white ring-1 ring-line flex items-center justify-center mb-4 shadow-soft">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-ink-900 mb-2">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{description}</p>
    </div>
  );
}
