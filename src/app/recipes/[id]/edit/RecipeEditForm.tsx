'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateRecipe } from '@/actions/recipe'
import { createClient } from '@/utils/supabase/client'
import styles from '../recipe-detail.module.css' // Reuse styles or create specific ones
import { 
  Utensils, 
  ListChecks, 
  Check, 
  X, 
  Tag, 
  Camera, 
  Plus, 
  Trash2,
  Save
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
    setLoading(true)
    try {
      const dataToSave = {
        title: recipe.title,
        base_servings: recipe.base_servings,
        image_url: recipe.image_url,
        source_url: recipe.source_url,
        ingredients,
        steps,
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

  // Tags logic
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }
  const removeTag = (tagToRemove: string) => setTags(tags.filter((t: string) => t !== tagToRemove))

  // Ingredients logic
  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngs = [...ingredients]
    newIngs[index] = { ...newIngs[index], [field]: value }
    setIngredients(newIngs)
  }
  const addIngredient = () => setIngredients([...ingredients, { name: '', original_text: '' }])
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index))

  // Steps logic
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
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <input 
              className={styles.titleEdit}
              value={recipe.title}
              onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
              placeholder="料理名"
            />
            <div className={styles.servings}>
              <input 
                type="number"
                value={recipe.base_servings || ''}
                onChange={(e) => setRecipe({ ...recipe, base_servings: parseInt(e.target.value) || null })}
                className={styles.servingsInput}
              />
              人分
            </div>
          </div>
          <div className={styles.controls}>
            <button className={styles.cancelButton} onClick={() => router.back()}>
              キャンセル
            </button>
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={loading || uploading}
            >
              <Save size={18} />
              {loading ? '保存中...' : '更新を保存'}
            </button>
          </div>
        </div>

        <div className={styles.headerMain}>
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
              </div>
            )}
            {uploading && <div className={styles.imageOverlay}>UP...</div>}
            <label className={styles.imageUploadLabel}>
              <Camera size={16} /> 変更
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
          </div>

          <div className={styles.tagArea}>
            <h3 className={styles.tagLabel}><Tag size={16} /> タグ</h3>
            <div className={styles.tagList}>
              {tags.map((tag: string) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button onClick={() => removeTag(tag)}><X size={12} /></button>
                </span>
              ))}
              <div className={styles.tagInputWrapper}>
                <input 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="追加..."
                />
                <button onClick={addTag}><Plus size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.contentGrid}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              <Utensils size={24} color="var(--primary-color)" /> 材料
            </h2>
            <button onClick={addIngredient} className={styles.addButton}><Plus size={16} /> 追加</button>
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
                <button onClick={() => removeIngredient(i)} className={styles.removeButton}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              <ListChecks size={24} color="var(--primary-color)" /> 手順
            </h2>
            <button onClick={addStep} className={styles.addButton}><Plus size={16} /> 追加</button>
          </div>
          <div className={styles.editList}>
            {steps.map((step, i) => (
              <div key={i} className={styles.editStepItem}>
                <div className={styles.stepNumber}>{step.step_number}</div>
                <textarea 
                  value={step.instruction} 
                  onChange={(e) => updateStep(i, e.target.value)}
                  className={styles.editTextarea}
                />
                <button onClick={() => removeStep(i)} className={styles.removeButton}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
