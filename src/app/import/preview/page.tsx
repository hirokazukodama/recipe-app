'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { saveRecipe } from '@/actions/recipe'
import { createClient } from '@/utils/supabase/client'
import { Utensils, ListChecks, Check, X, Tag, Camera, Plus, ArrowLeft, Loader2, Play } from 'lucide-react'

// RecipeDetailClientと同じ端数丸めロジックをプレビューでも使用
function prettyAmount(v: number | null): string {
  if (v === null) return "適量";
  if (v < 0.1) return "少々";
  const fractions: [number, string][] = [
    [1 / 8, "1/8"], [1 / 6, "1/6"], [1 / 4, "1/4"], [1 / 3, "1/3"],
    [1 / 2, "1/2"], [2 / 3, "2/3"], [3 / 4, "3/4"],
  ];
  const int = Math.floor(v);
  const frac = v - int;
  if (frac > 0.02 && frac < 0.98) {
    let best: string | null = null;
    let bestDiff = Infinity;
    for (const [f, s] of fractions) {
      const d = Math.abs(frac - f);
      if (d < bestDiff) { bestDiff = d; best = s; }
    }
    if (bestDiff < 0.06 && best) {
      return int > 0 ? `${int}と${best}` : best;
    }
  }
  return (Math.round(v * 10) / 10).toString();
}

export default function PreviewPage() {
  const [recipe, setRecipe] = useState<any>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const data = localStorage.getItem('temp_extracted_recipe')
    if (data) {
      const parsed = JSON.parse(data)
      setRecipe(parsed)
      if (parsed.tags && Array.isArray(parsed.tags)) {
        setTags(parsed.tags)
      }
    } else {
      router.push('/import')
    }
  }, [router])

  const handleSave = async () => {
    if (!recipe) return
    setLoading(true)
    try {
      await saveRecipe({ ...recipe, tags })
      localStorage.removeItem('temp_extracted_recipe')
    } catch (error) {
      console.error('Save error:', error)
      alert('保存に失敗しました。')
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !recipe) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('recipes')
        .upload(fileName, file)

      if (uploadError) throw uploadError
      setRecipe({ ...recipe, image_url: data.path })
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('画像のアップロードに失敗しました：' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  if (!recipe) return null

  const imageUrl = recipe.image_url?.startsWith('https') 
    ? recipe.image_url 
    : recipe.image_url ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}` : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-cream-50 text-ink-900 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header Actions */}
        <div className="py-6 flex items-center justify-between sticky top-14 z-20 bg-cream-50/90 backdrop-blur border-b border-line mb-6">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>修正してやり直す</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || uploading}
            className={`h-10 px-6 rounded-full text-sm font-semibold transition shadow-cta flex items-center gap-2 ${loading || uploading ? 'bg-coral-300 text-white cursor-not-allowed' : 'bg-coral-500 hover:bg-coral-600 text-white'}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{loading ? '保存中...' : 'この内容で保存する'}</span>
          </button>
        </div>

        {/* Hero Preview */}
        <section className="grid md:grid-cols-[minmax(0,1fr)_340px] gap-6 md:gap-8 items-start">
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-cream-200 ring-1 ring-line">
              {imageUrl ? (
                <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink-500">
                  <Camera className="w-8 h-8 opacity-50 mb-2" />
                  <span className="text-sm font-medium">画像がありません</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
              <label className="absolute bottom-4 right-4 h-10 px-4 rounded-full bg-white/90 backdrop-blur shadow-soft flex items-center gap-2 text-sm font-medium text-ink-900 cursor-pointer hover:bg-white transition">
                <Camera className="w-4 h-4" />
                <span>画像を変更</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
            
            <div className="bg-white ring-1 ring-line rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-forest-500" />
                <span>タグを編集</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-cream-50 ring-1 ring-line text-[13px] text-ink-900">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="w-5 h-5 rounded-full hover:bg-cream-200 flex items-center justify-center text-ink-500 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex-1 min-w-[120px] flex items-center gap-2 px-3 py-1 rounded-full bg-cream-50 ring-1 ring-line focus-within:ring-coral-500 focus-within:bg-white transition">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="新しいタグ..."
                    className="w-full bg-transparent border-none focus:outline-none text-[13px]"
                  />
                  <button onClick={addTag} className="text-ink-500 hover:text-coral-500">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {recipe.title}
              </h1>
              {recipe.base_servings && (
                <p className="text-ink-500 font-medium">{recipe.base_servings}人分の分量</p>
              )}
            </div>

            <div className="rounded-2xl bg-white ring-1 ring-line overflow-hidden">
              <div className="p-4 border-b border-line bg-cream-50">
                <h2 className="font-bold flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-forest-500" />
                  <span>抽出された材料</span>
                </h2>
              </div>
              <ul className="divide-y divide-line">
                {recipe.ingredients.map((ing: any, i: number) => (
                  <li key={i} className="px-4 py-3 flex items-center gap-3">
                    <span className="flex-1 text-[14px]">{ing.name}</span>
                    <span className="text-[14px] font-medium tnum">
                      {["大さじ", "小さじ", "カップ"].some(u => ing.unit?.includes(u)) ? (
                        <>
                          <span className="text-ink-500 text-[12px] mr-0.5">{ing.unit}</span>
                          {prettyAmount(ing.amount_value)}
                        </>
                      ) : (
                        <>
                          {prettyAmount(ing.amount_value)}
                          <span className="text-ink-500 text-[12px] ml-0.5">{ing.unit}</span>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white ring-1 ring-line overflow-hidden">
              <div className="p-4 border-b border-line bg-cream-50">
                <h2 className="font-bold flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-forest-500" />
                  <span>抽出された手順</span>
                </h2>
              </div>
              <ul className="divide-y divide-line">
                {recipe.steps.map((step: any, i: number) => (
                  <li key={i} className="px-4 py-3 flex gap-3">
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-coral-100 text-coral-600 text-[12px] font-bold shrink-0">
                      {step.step_number}
                    </span>
                    <p className="text-[14px] leading-relaxed text-ink-900 mt-0.5">
                      {step.instruction}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
