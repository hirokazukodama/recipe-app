'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../app/page.module.css'
import { Search, UtensilsCrossed, ExternalLink, ArrowUp, Loader2 } from 'lucide-react'
import { getDetailedRecipes } from '@/actions/recipe'

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
  initialHasMore: boolean
  totalCount: number
}

const LIMIT = 12

export default function RecipeDashboard({ 
  initialRecipes, 
  allTags, 
  initialHasMore, 
  totalCount: initialTotalCount 
}: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(initialRecipes.length)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  const router = useRouter()
  const observer = useRef<IntersectionObserver | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // レシピ読み込み関数
  const loadRecipes = useCallback(async (currentOffset: number, isNewSearch: boolean = false) => {
    if (loading) return
    setLoading(true)

    try {
      const result = await getDetailedRecipes({ 
        offset: currentOffset, 
        limit: LIMIT, 
        search, 
        tag: selectedTag || '' 
      })

      if (isNewSearch) {
        setRecipes(result.data)
        setOffset(result.data.length)
      } else {
        setRecipes(prev => [...prev, ...result.data])
        setOffset(prev => prev + result.data.length)
      }
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Failed to load recipes:', error)
    } finally {
      setLoading(false)
    }
  }, [search, selectedTag, loading])

  // 検索・タグ変更時の再取得（デバウンス）
  useEffect(() => {
    // 初回レンダリング時はスキップしたいが、search/tagが変わった時にoffsetを0にしてリロードする
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(() => {
      // 初期データと異なる場合のみ実行
      loadRecipes(0, true)
    }, 400)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search, selectedTag])

  // 無限スクロールの監視設定
  const lastRecipeRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadRecipes(offset)
      }
    }, { threshold: 0.5 })

    if (node) observer.current.observe(node)
  }, [loading, hasMore, offset, loadRecipes])

  // スクロール位置監視（トップに戻るボタン用）
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem', position: 'relative' }}>
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

      {recipes.length > 0 ? (
        <div className={styles.recipeGrid}>
          {recipes.map((recipe, index) => (
            <div 
              key={recipe.id} 
              ref={index === recipes.length - 1 ? lastRecipeRef : null}
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
                  {recipe.recipe_tags?.slice(0, 3).map(rt => (
                    <span key={rt.tags.id} className={styles.miniTag}>#{rt.tags.name}</span>
                  ))}
                  {recipe.recipe_tags && recipe.recipe_tags.length > 3 && (
                    <span className={styles.miniTag} style={{ opacity: 0.6 }}>
                      +{recipe.recipe_tags.length - 3}
                    </span>
                  )}
                </div>
                <div className={styles.recipeMeta}>
                  <span>{recipe.base_servings ? `${recipe.base_servings}人分` : '分量不明'}</span>
                  <span style={{ opacity: 0.7 }}>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
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

      {loading && (
        <div className={styles.loadingMore}>
          <Loader2 size={24} className={styles.spinner} />
          <span>読み込み中...</span>
        </div>
      )}

      {/* トップに戻るボタン */}
      <button 
        className={`${styles.scrollTopButton} ${showScrollTop ? styles.scrollTopVisible : ''}`}
        onClick={scrollToTop}
        aria-label="トップに戻る"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  )
}
