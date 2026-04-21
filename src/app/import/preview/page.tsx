'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveRecipe } from '@/actions/recipe'
import { createClient } from '@/utils/supabase/client'
import { scaleAmount, formatIngredientAmount } from '@/utils/recipe-utils'
import styles from './preview.module.css'
import { Utensils, ListChecks, Check, X, Tag, Camera, Plus, Users } from 'lucide-react'

export default function PreviewPage() {
  const [recipe, setRecipe] = useState<any>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [targetServings, setTargetServings] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const data = localStorage.getItem('temp_extracted_recipe')
    if (data) {
      const parsed = JSON.parse(data)
      setRecipe(parsed)
      // 元の人数がわかればそれをデフォルトにする、そうでなければ1人分
      setTargetServings(parsed.base_servings || 1)
      // AIが提案したタグがあればセット
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
      // タグをデータに含めて保存
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

      // 公開URLを取得（バケットがパブリックでない場合は署名付きURLが必要だが、今回はパスを保存）
      // SPEC通りに image_url に保存
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <p className={styles.servings}>
              {recipe.base_servings ? `${recipe.base_servings}人分` : '分量不明'}
              {recipe.source_url && (
                <span className={styles.sourceLabel}>
                  （ソース: {new URL(recipe.source_url).hostname}）
                </span>
              )}
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={() => router.back()}>
              <X size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              キャンセル
            </button>
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={loading || uploading}
            >
              <Check size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {loading ? '保存中...' : 'この内容で保存'}
            </button>
          </div>
        </div>

        <div className={styles.headerBottom}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              {recipe.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={recipe.image_url.startsWith('https') 
                    ? recipe.image_url 
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}`} 
                  alt={recipe.title} 
                  className={styles.recipeImage}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <Camera size={48} color="var(--border-color)" />
                  <p>画像なし</p>
                </div>
              )}
              {uploading && <div className={styles.imageOverlay}>アップロード中...</div>}
              <label className={styles.imageUploadLabel}>
                <Camera size={16} />
                変更
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
          </div>

          <div className={styles.tagSection}>
            <h3 className={styles.tagLabel}>
              <Tag size={16} />
              タグ
            </h3>
            <div className={styles.tagList}>
              {tags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button onClick={() => removeTag(tag)}><X size={12} /></button>
                </span>
              ))}
              <div className={styles.tagInputWrapper}>
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="タグを追加..."
                />
                <button onClick={addTag}><Plus size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              <Utensils size={24} color="var(--primary-color)" />
              材料
            </h2>
            <div className={styles.servingsSelector}>
              <Users size={16} />
              {[1, 2, 3, 4].map(num => (
                <button 
                  key={num}
                  className={`${styles.servingButton} ${targetServings === num ? styles.activeServing : ''}`}
                  onClick={() => setTargetServings(num)}
                >
                  {num}
                </button>
              ))}
              <span>人分</span>
            </div>
          </div>
          <div className={styles.ingredientList}>
            {recipe.ingredients.map((ing: any, i: number) => {
              const scaled = scaleAmount(ing.amount_value, recipe.base_servings, targetServings)
              return (
                <div key={i} className={styles.ingredientItem}>
                  <span className={styles.ingredientName}>{ing.name}</span>
                  <span className={styles.ingredientAmountText}>
                    {formatIngredientAmount(scaled, ing.unit, ing.original_text, recipe.base_servings, targetServings)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>
            <ListChecks size={24} color="var(--primary-color)" />
            手順
          </h2>
          <div className={styles.stepList}>
            {recipe.steps.map((step: any, i: number) => (
              <div key={i} className={styles.stepItem}>
                <div className={styles.stepNumber}>{step.step_number}</div>
                <div className={styles.stepContent}>{step.instruction}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
