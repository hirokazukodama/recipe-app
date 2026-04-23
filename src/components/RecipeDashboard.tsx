'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UtensilsCrossed, ExternalLink, ArrowUp, Loader2, ChefHat, AlertTriangle } from 'lucide-react'
import { getDetailedRecipes } from '@/actions/recipe'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

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

function relativeDate(date: string): string {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'たった今'
  return formatDistanceToNow(d, { addSuffix: true, locale: ja })
}

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
  const [userName, setUserName] = useState<string>('')
  const [total, setTotal] = useState(initialTotalCount)
  
  const router = useRouter()
  const observer = useRef<IntersectionObserver | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserName(user.email.split('@')[0])
      }
    })
  }, [])

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
        setTotal(result.totalCount)
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

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(() => {
      loadRecipes(0, true)
    }, 400)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search, selectedTag])

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

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Greeting & Meta */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink-900 mb-1">
          こんにちは{userName ? `、${userName}さん` : ''} 🍳
        </h1>
        <p className="text-sm text-ink-500">
          登録レシピ {total} 件
        </p>
      </div>

      {/* Search & Tags */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-300" />
          <input 
            type="text" 
            placeholder="レシピを検索..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-white ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-coral-500 transition shadow-sm text-[15px]"
          />
        </div>

        {allTags.length > 0 && (
          <div className="relative flex items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button 
                className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition ${!selectedTag ? 'bg-ink-900 text-white' : 'bg-white ring-1 ring-line text-ink-700 hover:bg-cream-50'}`}
                onClick={() => setSelectedTag(null)}
              >
                すべて
              </button>
              {allTags.map(tag => (
                <button 
                  key={tag}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition ${selectedTag === tag ? 'bg-ink-900 text-white' : 'bg-white ring-1 ring-line text-ink-700 hover:bg-cream-50'}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {/* Fade mask for horizontal scrolling hint */}
            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-cream-50 to-transparent pointer-events-none md:hidden" />
          </div>
        )}
      </div>

      {/* Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe, index) => {
            const tags = recipe.recipe_tags?.map(rt => rt.tags.name) || []
            const imageUrl = recipe.image_url?.startsWith('https') 
              ? recipe.image_url 
              : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}`

            return (
              <div
                key={recipe.id}
                ref={index === recipes.length - 1 ? lastRecipeRef : null}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
                className="group block cursor-pointer rounded-2xl bg-white ring-1 ring-line overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="relative aspect-[16/10] bg-cream-200 overflow-hidden">
                  {recipe.image_url ? (
                    <img 
                      src={imageUrl} 
                      alt={recipe.title}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300">
                      <ChefHat className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                  
                  {!recipe.base_servings && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 ring-1 ring-amber-200 text-[11px] text-amber-700 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      分量未確定
                    </span>
                  )}

                  {recipe.source_url && (
                    <a 
                      href={recipe.source_url} 
                      onClick={(e) => { e.stopPropagation(); window.open(recipe.source_url, '_blank') }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex place-items-center justify-center shadow-soft hover:bg-white transition"
                      title="元のサイトを見る"
                    >
                      <ExternalLink className="w-4 h-4 text-ink-700" />
                    </a>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[15px] leading-tight text-ink-900 group-hover:text-coral-600 transition line-clamp-2">
                    {recipe.title}
                  </h3>
                  
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.slice(0, 3).map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-cream-50 ring-1 ring-line text-[11px] text-ink-700">
                          #{t}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] text-ink-500 font-medium">
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs font-medium text-ink-500">
                    <span>{recipe.base_servings ? `${recipe.base_servings}人分` : '-'}</span>
                    <time className="tnum">{relativeDate(recipe.created_at)}</time>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : !loading && (
        <div className="py-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-ink-300" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 mb-2">
            {search || selectedTag ? '条件に合うレシピが見つかりません' : 'まだレシピがありません'}
          </h3>
          <p className="text-sm text-ink-500">
            {search || selectedTag ? '検索条件を変えてみてください。' : '「レシピを追加」ボタンから最初のレシピを登録しましょう。'}
          </p>
        </div>
      )}

      {loading && (
        <div className="py-8 flex justify-center items-center gap-2 text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">読み込み中...</span>
        </div>
      )}

      {/* トップに戻るボタン */}
      <button 
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-ink-900 text-white shadow-soft flex items-center justify-center transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        onClick={scrollToTop}
        aria-label="トップに戻る"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  )
}
