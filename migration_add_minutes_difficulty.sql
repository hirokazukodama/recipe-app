-- Gemini抽出スキーマ拡張用：調理時間（minutes）と難易度（difficulty）の追加
-- Supabase の SQL Editor で実行してください。

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS minutes int4 NULL;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS difficulty text NULL;
