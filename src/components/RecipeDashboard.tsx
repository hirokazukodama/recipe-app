'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../app/page.module.css'
import { Plus, Search, Tag, UtensilsCrossed, ExternalLink } from 'lucide-react'

interface Recipe {
  id: string
  title: string
  image_url?: string
  source_url?: string
  base_servings?: number
  created_at: string
  recipe_tags?: {
    tags: {
      id: string
      name: string
    }
  }[]
}

interface Props {
  initialRecipes: Recipe[]
  allTags: string[]
}

export default function RecipeDashboard({ initialRecipes, allTags }: Props) {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const router = useRouter()

  const filteredRecipes = useMemo(() => {
    return initialRecipes.filter(recipe => {
      const matchSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
      const matchTag = !selectedTag || recipe.recipe_tags?.some(rt => rt.tags.name === selectedTag)
      return matchSearch && matchTag
    })
  }, [initialRecipes, search, selectedTag])

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <div className={styles.dashboardActions}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="レシピを検索..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {allTags.length > 0 && (
          <div className={styles.tagFilter}>
            <button 
              className={`${styles.tagButton} ${!selectedTag ? styles.activeTag : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              すべて
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                className={`${styles.tagButton} ${selectedTag === tag ? styles.activeTag : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredRecipes.length > 0 ? (
        <div className={styles.recipeGrid}>
          {filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className={styles.recipeCard}
              onClick={() => router.push(`/recipes/${recipe.id}`)}
            >
              <div className={styles.recipeImageWrapper}>
                {recipe.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={recipe.image_url.startsWith('https') 
                      ? recipe.image_url 
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}`} 
                    alt={recipe.title}
                    className={styles.recipeThumbnail}
                  />
                ) : (
                  <div className={styles.recipePlaceholder}>
                    <UtensilsCrossed size={32} color="var(--border-color)" />
                  </div>
                )}
                {recipe.source_url && (
                  <button 
                    className={styles.sourceLink}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(recipe.source_url, '_blank', 'noopener,noreferrer')
                    }}
                    title="元のサイトを見る"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
              <div className={styles.recipeInfo}>
                <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                <div className={styles.recipeCardTags}>
                  {recipe.recipe_tags?.map(rt => (
                    <span key={rt.tags.id} className={styles.miniTag}>#{rt.tags.name}</span>
                  ))}
                </div>
                <div className={styles.recipeMeta}>
                  <span>{recipe.base_servings ? `${recipe.base_servings}人分` : '分量不明'}</span>
                  <span style={{ opacity: 0.7 }}>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <UtensilsCrossed size={48} color="var(--border-color)" style={{ marginBottom: '1.5rem' }} />
          <h3 className={styles.emptyTitle}>
            {search || selectedTag ? '条件に合うレシピが見つかりません' : 'まだレシピがありません'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || selectedTag ? '検索条件を変えてみてください。' : '「レシピを追加」ボタンから最初のレシピを登録しましょう。'}
          </p>
        </div>
      )}
    </div>
  )
}
