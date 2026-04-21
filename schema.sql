-- Recipe Auto-Importer 初期データベース構築スクリプト
-- ※ このスクリプトは Supabase の SQL Editor に貼り付けて実行してください。

-- 1. テーブル作成
CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_url text,
  base_servings int4,
  image_url text,
  is_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount_value numeric,
  unit text,
  original_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number int4 NOT NULL,
  instruction text NOT NULL,
  video_timestamp int4,
  created_at timestamptz DEFAULT now()
);

-- 2. 行レベルセキュリティ (RLS) の有効化
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシーの設定
-- recipes: 自分のデータのみSELECT/INSERT/UPDATE/DELETE可能
CREATE POLICY "Users can manage their own recipes" 
ON public.recipes 
FOR ALL USING (auth.uid() = user_id);

-- ingredients: 自分のレシピに関連づく材料のみ操作可能
CREATE POLICY "Users can manage ingredients of their own recipes" 
ON public.ingredients 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

-- steps: 自分のレシピに関連づく手順のみ操作可能
CREATE POLICY "Users can manage steps of their own recipes" 
ON public.steps 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = steps.recipe_id
    AND recipes.user_id = auth.uid()
  )
);
