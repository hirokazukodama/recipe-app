# Recipe Auto-Importer プロジェクト仕様書

**Version 2.3 | 2026.04.21版（Phase 2 安定化完了版）**

---

## 1. プロジェクト概要

ユーザーがコピー＆ペーストしたレシピテキスト、あるいはURLまたはYouTubeから、AI（Gemini）を用いて構造化データを抽出し、Supabase DBへ保存・管理するレシピ管理アプリケーション。

> [!NOTE]
> **v2.2 → v2.3 改訂内容**:
> - **分量計算の堅牢化**: `amount_value`が欠損している場合でも`original_text`から数値を自動抽出しスケーリングするフォールバック処理を実装。
> - **人数範囲の解析**: 「3〜4人前」などの表記を検知し、少ない方の数値を基準人数とするロジックをAI/コード双方に追加。
> - **YouTubeインポートの安定化**: 字幕の文字数制限（4,000文字）とTimeout延長（60s）により503エラーおよびタイムアウトを防止。
> - **自動タグ付けの強化**: 料理ジャンル、材料、調理法に基づく一貫性のあるタグ生成プロンプトの導入。

---

## 2. 技術スタック

| 項目 | 仕様 |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (CSS Modules) |
| Database & Auth | Supabase (PostgreSQL) |
| AI Engine | **Google Gemini API (gemini-2.5-flash)** |
| AI SDK | **@google/genai** |
| Infrastructure | Vercel |

※ SupabaseとVercelはGithubアカウントと連携

---

## 3. データベース設計 (Supabase)

正規化されたスキーマを採用し、全テーブルにPK・タイムスタンプを設け、RLSを初期から有効化する。

### 3.1. Recipes テーブル（レシピ基本情報）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK, default: gen_random_uuid() | ユニークID |
| user_id | uuid | FK (auth.users), not null | 登録ユーザー（RLS用） |
| title | text | not null | レシピ名 |
| source_url | text | | 元サイトのURL |
| base_servings | int4 | | 基準人数（例: 2） |
| image_url | text | | Supabase StorageオブジェクトパスまたはURL |
| is_confirmed | boolean | default: false | AI解析後の確認が済んだか |
| created_at | timestamptz | default: now() | 作成日時 |
| updated_at | timestamptz | default: now() | 更新日時 |

🔐 RLS: `user_id = auth.uid()` によるRow Level Securityポリシー適用。

### 3.2. Ingredients テーブル（材料）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK, default: gen_random_uuid() | ユニークID |
| recipe_id | uuid | FK (recipes.id) ON DELETE CASCADE, not null | どのレシピの材料か |
| name | text | not null | 材料名（例: A しょうゆ） |
| amount_value | numeric | | 数値（例: 250） |
| unit | text | | 単位（例: g） |
| original_text | text | | 元の表記（例: 1枚） |
| created_at | timestamptz | default: now() | 作成日時 |

### 3.3. Steps テーブル（調理手順）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK, default: gen_random_uuid() | ユニークID |
| recipe_id | uuid | FK (recipes.id) ON DELETE CASCADE, not null | どのレシピの手順か |
| step_number | int4 | not null | 順番（1, 2, 3...） |
| instruction | text | not null | 内容テキスト |
| video_timestamp | int4 | | YouTubeの場合の開始秒数（任意） |
| created_at | timestamptz | default: now() | 作成日時 |

### 3.4. Tags テーブル（タグ管理）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK, default: gen_random_uuid() | ユニークID |
| name | text | not null | タグ名（例: 時短, 和食） |
| user_id | uuid | FK (auth.users), not null | 登録ユーザー |
| created_at | timestamptz | default: now() | 作成日時 |

🔐 独自制約: `UNIQUE(user_id, name)` で重複登録を禁止。RLS有効。

### 3.5. Recipe_Tags テーブル（レシピとタグの紐付け / 多対多）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| recipe_id | uuid | FK (recipes.id) ON DELETE CASCADE | 紐付けるレシピ |
| tag_id | uuid | FK (tags.id) ON DELETE CASCADE | 紐付けるタグ |

---

## 4. API / インフラ構成

### 4.1. 環境変数（Vercel）

| 変数名 | 説明 | スコープ |
|---|---|---|
| GEMINI_API_KEY | Google AI Studio APIキー | サーバーサイドのみ |
| YOUTUBE_API_KEY | YouTube Data API v3キー | サーバーサイドのみ |
| NEXT_PUBLIC_SUPABASE_URL | Supabase プロジェクトURL | クライアント公開可 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key | クライアント公開可 |

### 4.2. Gemini API 接続仕様

- **モデル**: `gemini-2.5-flash` （高負荷・ハルシネーション対策として2.5系安定版を使用し自動リトライロジックを実装）
- **推論プロンプトの仕様**:
  - 調理手順の統一（常体、口語の排除、1〜2文に要約）
  - ハルシネーションの絶対的禁止（テキストにない材料・手順・分量を推測で補完しない）
  - グループラベル（「A しょうゆ」等）の材料名への付与
  - 料理内容に基づく関連タグ（3〜5個）の自動生成

### 4.3. URL / YouTube からのインポート仕様

**Web URL（レシピサイト）**
- `cheerio` を用いてサーバーサイドでHTMLをフェッチし、本文（`<article>`, `<main>`等）とJSON-LDを抽出。
- `og:image` や JSON-LD から料理画像URLを自動抽出。

**YouTube URL**
- `googleapis` (YouTube Data API v3) で動画のタイトルと説明欄を取得。
- `youtube-transcript` を用いて動画の字幕を取得し、プロンプトへ追加。
- 完成写真はYouTubeサムネイル（`maxresdefault.jpg`等）を自動設定。

### 4.4. 分量の自動計算機能（Servings Scaler）

- 1〜4人分への人数切り替えボタンを提供。
- **計算ロジック**: `(抽出された数値 / 元の人数) * 指定人数`
- **表示成形**: 分数表記への自然な変換（例: `0.5` → `1/2`）と、日本のレシピの単位慣習への最適化（例: `大さじ1` vs `100g`）。
- **非数値項目**: 「適量」「少々」などは計算せずそのまま表示。

### 4.5. レシピの編集・削除仕様

- **削除**: RLSおよび `ON DELETE CASCADE` により、関連する材料・手順・タグ付けも一括で安全に削除。
- **編集**: タイトル、人数、画像、タグ、材料（追加/変更/削除）、手順（追加/変更/削除）を更新可能。更新時は既存の材料・手順をリファクタリング（DELETE & INSERT）し、データの完全な同期を担保する。

### 4.6. image_url の管理方針

- 自動抽出した外部サイト/YouTubeの画像: プロトコル(`https://`)付きでURLをそのままDB保存。
- ユーザー手動アップロード: Supabase Storage (`recipes` バケット、ユーザーID隔離フォルダ) に保存し、オブジェクトパスをDBへ記録。

---

## 5. セキュリティ設計

### 5.1. Row Level Security（RLS）

全テーブルに対してRLSを有効化。

| テーブル | 操作 | ポリシー |
|---|---|---|
| recipes | ALL | `auth.uid() = user_id` |
| tags | ALL | `auth.uid() = user_id` |
| ingredients/steps/recipe_tags | ALL | recipesテーブルとJOINし、`recipes.user_id = auth.uid()` であること |

---

## 6. 実装ロードマップ

### フェーズ1（MVP）✅ 完了
- テキスト貼り付けによるレシピインポート
- Gemini APIによる構造化データ抽出（JSON）
- Recipes / Ingredients / Steps への3テーブルトランザクション保存
- 保存前の確認・編集画面

### フェーズ2（拡張）✅ 完了
- Web URL および YouTube からのインポート対応（画像抽出・字幕取得）
- 画像アップロード（Supabase Storage）と差し替え
- タグの自動提案、手動管理機能
- レシピダッシュボードの検索・タグ絞り込み
- レシピ詳細ページの作成（人数切替による分量自動計算付）
- レシピの編集・削除機能の実装

---

## 7. 未解決事項・今後の展望

- ユーザー間でのレシピ共有機能（フェーズ3移行時検討）
- URLスクレイピング禁止サイト向けの代替案確保や利用規約の遵守
