-- Phase 2 追加データベース構築スクリプト
-- ※ このスクリプトは Supabase の SQL Editor に貼り付けて追加実行してください。

-- 1. タグ管理テーブルの作成
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 2. レシピとタグの紐付けテーブル（多対多）
CREATE TABLE IF NOT EXISTS public.recipe_tags (
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- 3. 行レベルセキュリティ (RLS) の有効化
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシーの設定
-- tags: 自分のタグのみ操作可能
CREATE POLICY "Users can manage their own tags"
ON public.tags
FOR ALL USING (auth.uid() = user_id);

-- recipe_tags: 自分のレシピに関連づくタグのみ操作可能
CREATE POLICY "Users can manage their own recipe_tags"
ON public.recipe_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_tags.recipe_id
    AND recipes.user_id = auth.uid()
  )
);
