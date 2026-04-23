'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { google } from 'googleapis'
import { YoutubeTranscript } from 'youtube-transcript'
import { fetchPageData, extractYouTubeId } from '@/utils/fetch-utils'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function extractRecipe(input: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { error: 'APIキーが設定されていません。.env.local を確認してください。' }
  }

  const ai = new GoogleGenerativeAI(apiKey)
  let textToProcess = input
  let autoImageUrl = ''
  let sourceUrl = ''

  // URLかどうかを判定
  if (input.trim().startsWith('http')) {
    sourceUrl = input.trim()
    const youtubeId = extractYouTubeId(sourceUrl)

    try {
      if (youtubeId) {
        // YouTubeの場合
        const youtubeApiKey = process.env.YOUTUBE_API_KEY
        if (!youtubeApiKey) {
          return { error: 'YouTube APIキーが設定されていません。.env.local に YOUTUBE_API_KEY を設定してください。' }
        }

        const youtube = google.youtube({
          version: 'v3',
          auth: youtubeApiKey,
        })

        const videoRes = await youtube.videos.list({
          part: ['snippet'],
          id: [youtubeId],
        })

        const snippet = videoRes.data.items?.[0]?.snippet
        const title = snippet?.title || ''
        const description = snippet?.description || ''
        
        // 字幕を取得 (オプション)
        let transcript = ''
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(youtubeId)
          const rawTranscript = transcriptData.map(t => t.text).join(' ')
          // Geminiへの送信データ量を抑えるため先頭4000文字に制限
          transcript = rawTranscript.slice(0, 4000)
        } catch (e) {
          console.warn('Transcript not available:', e)
        }

        // 説明欄も長い場合があるため1000文字に制限
        const trimmedDescription = description.slice(0, 1000)
        textToProcess = `Title: ${title}\nDescription: ${trimmedDescription}\nTranscript: ${transcript}`
        autoImageUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      } else {
        // 一般的なURLの場合
        const pageData = await fetchPageData(sourceUrl)
        textToProcess = `Title: ${pageData.title}\nContent: ${pageData.textContent}`
        autoImageUrl = pageData.imageUrl || ''
      }
    } catch (e: any) {
      console.error('External fetch error:', e)
      return { error: `URLからの情報取得に失敗しました（${e.message}）。URLを確認するか、テキストを直接貼り付けてください。` }
    }
  }

  const prompt = `
以下のレシピ関連テキストから、料理名、分量（人数）、材料リスト、調理手順を抽出し、以下のJSON形式で出力してください。
JSON以外のテキストは一切含めないでください。

【最重要ルール：ハルシネーションの防止】
- 提供された「レシピテキスト」に書かれている内容のみを使用してください。
- テキストに記載がない材料、分量、手順をあなたの知識から勝手に推測したり、補完したりしないでください。
- もし分量や単位がテキストに記載されていない場合は、必ず \`null\` または空文字を設定してください（例: 「適量」や「少々」と推測して書かないこと）。

【手順の記述ルール】
- 口語的・フランクな表現（「〜しちゃう」「〜するよ」等）は使用しないこと。
- 一般的なレシピ本で使われるような簡潔な文体で統一すること。
- 「〜する。」「〜を加える。」のように、です・ます調ではなく常体（である調）で記述すること。
- 1つの手順は1〜2文程度に収め、簡潔にまとめること。
- 材料に「A」「B」「★」などのグループラベルがある場合は、材料名にそのラベルを含めて記述すること（例：「A しょうゆ」、「★ 砂糖」）。

【タグ生成ルール】
- 以下の観点から、その料理に最も適したタグを3〜5個程度生成してください。
- 観点：料理のジャンル（和食、イタリアン等）、主材料（鶏肉、じゃがいも等）、調理法（煮物、炒め物等）、特徴（時短、節約、おつまみ等）。

JSON構造：
{
  "title": "料理名",
  "base_servings": 人数（数値。「3〜4人前」のような範囲表記の場合は少ない方の数値を採用すること。例：「3〜4人前」→ 3。不明ならnull）,
  "minutes": 合計調理時間（数値、分。不明時はnull）,
  "difficulty": "初級" | "中級" | "上級" | null,
  "tags": ["タグ1", "タグ2", "タグ3"],
  "ingredients": [
    {
      "name": "材料名（グループラベルがある場合はそれを含める。例：A しょうゆ）",
      "amount_value": 数値（例: 300、分量から数値を抽出。不明や「適量」ならnull）,
      "unit": "単位（例: g, ml, 個, 大さじ。不明ならnull）",
      "original_text": "元の分量表記（例: 300g, 1/2個, 少々）"
    }
  ],
  "steps": [
    {
      "step_number": 順序（1からの連番）,
      "instruction": "手順の内容"
    }
  ]
}

レシピテキスト：
${textToProcess}
`

  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  // リトライ処理を含めた生成
  let responseText = ''
  let retries = 3
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt)
      responseText = result.response.text()
      break
    } catch (error: any) {
      retries--
      if (retries === 0 || !error.message?.includes('503')) {
        console.error('Gemini extraction error:', error)
        const errorMessage = error?.message || '不明なエラー'
        return { error: `レシピの解析に失敗しました（${errorMessage}）。しばらく時間をおいてから再度お試しください。` }
      }
      // 1秒待ってリトライ
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  try {
    const jsonText = responseText.replace(/```json\n?|\n?```/g, '').trim()
    const extractedData = JSON.parse(jsonText)

    // base_servings の後処理：小数や範囲の場合に補正する
    let baseServings = extractedData.base_servings
    if (typeof baseServings === 'number') {
      // 小数の場合は切り上げ（例: 3.5 → 3 の小さい方）
      baseServings = Math.floor(baseServings)
    } else if (typeof baseServings === 'string') {
      // 「3〜4」「3-4」のような範囲表記が文字列で返ってきた場合、最小値を取る
      const rangeMatch = baseServings.match(/(\d+)\s*[〜~\-]\s*\d+/)
      if (rangeMatch) {
        baseServings = parseInt(rangeMatch[1])
      } else {
        const num = parseInt(baseServings)
        baseServings = isNaN(num) ? null : num
      }
    }
    
    return { 
      data: { 
        ...extractedData,
        base_servings: baseServings,
        image_url: autoImageUrl,
        source_url: sourceUrl 
      } 
    }
  } catch (error: any) {
    console.error('JSON parse error:', error, responseText)
    return { error: '解析結果の読み取りに失敗しました。もう一度お試しください。' }
  }
}

export async function saveRecipe(recipeData: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Recipesテーブルへ挿入
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: recipeData.title,
      base_servings: recipeData.base_servings,
      minutes: recipeData.minutes,
      difficulty: recipeData.difficulty,
      image_url: recipeData.image_url,
      source_url: recipeData.source_url,
      is_confirmed: true
    })
    .select()
    .single()

  if (recipeError) throw recipeError

  // Ingredientsテーブルへ挿入
  const ingredients = recipeData.ingredients.map((ing: any) => ({
    recipe_id: recipe.id,
    name: ing.name,
    amount_value: ing.amount_value,
    unit: ing.unit,
    original_text: ing.original_text
  }))

  const { error: ingError } = await supabase.from('ingredients').insert(ingredients)
  if (ingError) throw ingError

  // Stepsテーブルへ挿入
  const steps = recipeData.steps.map((step: any) => ({
    recipe_id: recipe.id,
    step_number: step.step_number,
    instruction: step.instruction
  }))

  const { error: stepError } = await supabase.from('steps').insert(steps)
  if (stepError) throw stepError

  // タグの一括処理（高速化）
  if (recipeData.tags && recipeData.tags.length > 0) {
    const validTags = Array.from(new Set(recipeData.tags.map((t: string) => t.trim()).filter(Boolean))) as string[];

    if (validTags.length > 0) {
      // 1. 既存のタグを一括取得
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', user.id)
        .in('name', validTags);

      const existingTagNames = new Set(existingTags?.map(t => t.name) || []);
      const newTagNames = validTags.filter(name => !existingTagNames.has(name));

      let allTagIds = existingTags?.map(t => t.id) || [];

      // 2. 新規タグがあれば一括作成
      if (newTagNames.length > 0) {
        const newTagsToInsert = newTagNames.map(name => ({ user_id: user.id, name }));
        const { data: newlyInsertedTags, error: createError } = await supabase
          .from('tags')
          .insert(newTagsToInsert)
          .select('id');

        if (!createError && newlyInsertedTags) {
          allTagIds = [...allTagIds, ...newlyInsertedTags.map(t => t.id)];
        } else {
          console.error('Bulk tag creation error:', createError);
        }
      }

      // 3. レシピとの紐付けを一括作成
      if (allTagIds.length > 0) {
        const recipeTagsToInsert = allTagIds.map(tag_id => ({
          recipe_id: recipe.id,
          tag_id: tag_id
        }));
        await supabase.from('recipe_tags').insert(recipeTagsToInsert);
      }
    }
  }

  redirect('/')
}

export async function deleteRecipe(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  
  if (error) {
    console.error('Delete error:', error)
    throw new Error('削除に失敗しました。')
  }
  
  redirect('/')
}

export async function updateRecipe(id: string, recipeData: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Recipesテーブルの更新
  const { error: recipeError } = await supabase
    .from('recipes')
    .update({
      title: recipeData.title,
      base_servings: recipeData.base_servings,
      minutes: recipeData.minutes,
      difficulty: recipeData.difficulty,
      image_url: recipeData.image_url,
      source_url: recipeData.source_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (recipeError) throw recipeError

  // 2. Ingredientsの更新（削除して再挿入）
  await supabase.from('ingredients').delete().eq('recipe_id', id)
  const ingredients = recipeData.ingredients.map((ing: any) => ({
    recipe_id: id,
    name: ing.name,
    amount_value: ing.amount_value,
    unit: ing.unit,
    original_text: ing.original_text
  }))
  const { error: ingError } = await supabase.from('ingredients').insert(ingredients)
  if (ingError) throw ingError

  // 3. Stepsの更新（削除して再挿入）
  await supabase.from('steps').delete().eq('recipe_id', id)
  const steps = recipeData.steps.map((step: any) => ({
    recipe_id: id,
    step_number: step.step_number,
    instruction: step.instruction
  }))
  const { error: stepError } = await supabase.from('steps').insert(steps)
  if (stepError) throw stepError

  // 4. タグの一括更新（高速化）
  await supabase.from('recipe_tags').delete().eq('recipe_id', id)
  if (recipeData.tags && recipeData.tags.length > 0) {
    const validTags = Array.from(new Set(recipeData.tags.map((t: string) => t.trim()).filter(Boolean))) as string[];

    if (validTags.length > 0) {
      // 1. 既存のタグを一括取得
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', user.id)
        .in('name', validTags);

      const existingTagNames = new Set(existingTags?.map(t => t.name) || []);
      const newTagNames = validTags.filter(name => !existingTagNames.has(name));

      let allTagIds = existingTags?.map(t => t.id) || [];

      // 2. 新規タグがあれば一括作成
      if (newTagNames.length > 0) {
        const newTagsToInsert = newTagNames.map(name => ({ user_id: user.id, name }));
        const { data: newlyInsertedTags, error: createError } = await supabase
          .from('tags')
          .insert(newTagsToInsert)
          .select('id');

        if (!createError && newlyInsertedTags) {
          allTagIds = [...allTagIds, ...newlyInsertedTags.map(t => t.id)];
        }
      }

      // 3. レシピとの紐付けを一括作成
      if (allTagIds.length > 0) {
        const recipeTagsToInsert = allTagIds.map(tag_id => ({
          recipe_id: id,
          tag_id: tag_id
        }));
        await supabase.from('recipe_tags').insert(recipeTagsToInsert);
      }
    }
  }

  redirect(`/recipes/${id}`)
}

export async function getDetailedRecipes({ 
  offset = 0, 
  limit = 12, 
  search = '', 
  tag = '' 
}: { 
  offset?: number, 
  limit?: number, 
  search?: string, 
  tag?: string 
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Unauthorized' }

  let query = supabase
    .from('recipes')
    .select(`
      *,
      recipe_tags!inner(
        tags!inner(id, name)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 検索条件の追加
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  // タグ絞り込みの追加
  if (tag) {
    // タグ名で絞り込む。!innerを使用しているため、条件に合うものがない場合はレシピ自体が返らない
    query = query.eq('recipe_tags.tags.name', tag)
  } else {
    // タグ絞り込みがない場合、中間テーブルがないレシピ（稀）も取得できるように !inner を外したクエリに切り替える必要がある
    // ただし基本全レシピにタグは付与される設計なので、利便性重視で inner join なしをベースにする
    query = supabase
      .from('recipes')
      .select(`
        *,
        recipe_tags(
          tags(id, name)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Fetch recipes error:', error)
    return { data: [], error: error.message }
  }

  return { 
    data: (data as any) || [], 
    totalCount: count || 0,
    hasMore: (count || 0) > offset + limit
  }
}

export async function getTags() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tags')
    .select('name')
    .eq('user_id', user.id)
    .order('name')

  return Array.from(new Set((data || []).map(t => t.name)))
}
