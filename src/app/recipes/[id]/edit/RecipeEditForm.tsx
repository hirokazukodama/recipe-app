'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateRecipe } from '@/actions/recipe'
import { createClient } from '@/utils/supabase/client'
import styles from './recipe-edit.module.css'
import { 
  Utensils, 
  ListChecks, 
  X, 
  Tag as TagIcon, 
  Camera, 
  Plus, 
  Trash2,
  Save,
  ArrowLeft,
  Loader2
} from 'lucide-react'

interface Props {
  initialRecipe: any
}

export default function RecipeEditForm({ initialRecipe }: Props) {
  const [recipe, setRecipe] = useState(initialRecipe)
  const [ingredients, setIngredients] = useState([...initialRecipe.ingredients])
  const [steps, setSteps] = useState([...initialRecipe.steps].sort((a, b) => a.step_number - b.step_number))
  const [tags, setTags] = useState(initialRecipe.recipe_tags?.map((rt: any) => rt.tags.name) || [])
  
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    if (!recipe.title.trim()) {
      alert('料理名を入力してください。')
      return
    }
    setLoading(true)
    try {
      const dataToSave = {
        title: recipe.title,
        base_servings: recipe.base_servings,
        image_url: recipe.image_url,
        source_url: recipe.source_url,
        minutes: recipe.minutes,
        difficulty: recipe.difficulty,
        ingredients: ingredients.filter(ing => ing.name.trim()),
        steps: steps.filter(step => step.instruction.trim()),
        tags
      }
      await updateRecipe(recipe.id, dataToSave)
    } catch (error) {
      console.error('Update error:', error)
      alert('保存に失敗しました。')
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
  const removeTag = (tagToRemove: string) => setTags(tags.filter((t: string) => t !== tagToRemove))

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngs = [...ingredients]
    newIngs[index] = { ...newIngs[index], [field]: value }
    // 分量テキストが手動変更された場合、古い解析値（数値・単位）をクリアして表示の不整合を防ぐ
    if (field === 'original_text') {
      newIngs[index].amount_value = null
      newIngs[index].unit = null
    }
    setIngredients(newIngs)
  }
  const addIngredient = () => setIngredients([...ingredients, { name: '', original_text: '' }])
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index))

  const updateStep = (index: number, instruction: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], instruction }
    setSteps(newSteps)
  }
  const addStep = () => setSteps([...steps, { step_number: steps.length + 1, instruction: '' }])
  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 }))
    setSteps(newSteps)
  }

  return (
    <div className={styles.container + " container"}>
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <button onClick={() => router.back()} className={styles.cancelButton} style={{ padding: '0.5rem', border: 'none', background: 'none', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.headerTitle}>レシピを編集</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.cancelButton} onClick={() => router.back()}>
            キャンセル
          </button>
          <button 
            className={styles.saveButton} 
            onClick={handleSave}
            disabled={loading || uploading}
          >
            {loading ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {loading ? '保存中...' : '更新を保存'}
          </button>
        </div>
      </header>

      <div className={styles.formGrid}>
        <aside className={styles.sidebar}>
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
                  <Camera size={48} />
                  <span>写真をアップロード</span>
                </div>
              )}
              {uploading && <div className={styles.imageOverlay}><Loader2 className="spinner" /></div>}
              <label className={styles.imageUploadLabel}>
                <Camera size={20} />
                <span>写真を変更</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
          </div>

          <div className={styles.tagSection}>
            <h3 className={styles.tagLabel}><TagIcon size={18} /> タグ</h3>
            <div className={styles.tagList}>
              {tags.map((tag: string) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button onClick={() => removeTag(tag)} className={styles.removeTagButton}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.tagInputWrapper}>
              <input 
                className={styles.tagInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="新しいタグ..."
              />
              <button className={styles.tagAddButton} onClick={addTag}>
                <Plus size={18} />
              </button>
            </div>
          </div>
        </aside>

        <main className={styles.mainForm}>
          <section className={styles.formSection}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>料理名</label>
              <input 
                className={styles.inputFull}
                value={recipe.title}
                onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
                placeholder="例: 極上ハンバーグ"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>分量</label>
              <div className={styles.servingsInputWrapper}>
                <input 
                  type="number"
                  value={recipe.base_servings || ''}
                  onChange={(e) => setRecipe({ ...recipe, base_servings: parseInt(e.target.value) || null })}
                  className={styles.servingsInput}
                  placeholder="2"
                />
                <span className={styles.fieldLabel}>人分</span>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>調理時間</label>
              <div className={styles.servingsInputWrapper}>
                <input 
                  type="number"
                  value={recipe.minutes || ''}
                  onChange={(e) => setRecipe({ ...recipe, minutes: parseInt(e.target.value) || null })}
                  className={styles.servingsInput}
                  placeholder="30"
                />
                <span className={styles.fieldLabel}>分</span>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>難易度</label>
              <select 
                value={recipe.difficulty || ''}
                onChange={(e) => setRecipe({ ...recipe, difficulty: e.target.value || null })}
                className={styles.inputFull}
              >
                <option value="">未設定</option>
                <option value="初級">初級</option>
                <option value="中級">中級</option>
                <option value="上級">上級</option>
              </select>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Utensils size={24} color="var(--primary-color)" /> 材料
              </h2>
              <button onClick={addIngredient} className={styles.addButton}>
                <Plus size={16} /> 追加
              </button>
            </div>
            <div className={styles.editList}>
              {ingredients.map((ing, i) => (
                <div key={i} className={styles.editItem}>
                  <input 
                    value={ing.name} 
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="材料名"
                    className={styles.editInputName}
                  />
                  <input 
                    value={ing.original_text} 
                    onChange={(e) => updateIngredient(i, 'original_text', e.target.value)}
                    placeholder="分量"
                    className={styles.editInputAmount}
                  />
                  <button onClick={() => removeIngredient(i)} className={styles.removeButton}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <ListChecks size={24} color="var(--primary-color)" /> 手順
              </h2>
              <button onClick={addStep} className={styles.addButton}>
                <Plus size={16} /> 追加
              </button>
            </div>
            <div className={styles.editList}>
              {steps.map((step, i) => (
                <div key={i} className={styles.editStepItem}>
                  <div className={styles.stepNumber}>{step.step_number}</div>
                  <textarea 
                    value={step.instruction} 
                    onChange={(e) => updateStep(i, e.target.value)}
                    className={styles.editTextarea}
                    placeholder="調理手順を入力..."
                  />
                  <button onClick={() => removeStep(i)} className={styles.removeButton}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
