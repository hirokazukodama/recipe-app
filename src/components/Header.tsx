'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, ChefHat } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Header({ initialUser }: { initialUser: any }) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(initialUser)
  const supabase = createClient()

  useEffect(() => {
    // サーバーサイドからの初期値をセット（ハイドレーション対策）
    if (initialUser) setUser(initialUser)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [initialUser, supabase.auth])

  const shouldHideAddButton = 
    pathname.startsWith('/auth/') || 
    pathname.startsWith('/import')

  return (
    <header className="sticky top-0 z-30 bg-cream-50/80 backdrop-blur border-b border-line">
      <div className="max-w-5xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-coral-500 to-coral-700 flex place-items-center justify-center text-white shadow-soft">
            <ChefHat className="w-4 h-4" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink-900 hidden xs:block">Recipe AI</span>
        </Link>
        
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {!shouldHideAddButton && (
                <Link
                  href="/import"
                  className="inline-flex items-center gap-1.5 h-9 px-3 xs:px-4 rounded-full bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold shadow-cta transition shrink-0"
                  aria-label="レシピを追加"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden xs:inline">追加</span>
                </Link>
              )}
              <button className="w-9 h-9 rounded-full bg-white ring-1 ring-line flex place-items-center justify-center shadow-soft shrink-0">
                <span className="text-[11px] font-bold text-ink-700">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/auth/login" className="text-sm font-bold text-ink-700 hover:text-ink-900 px-2 sm:px-3 py-2 transition shrink-0">
                ログイン
              </Link>
              <Link href="/auth/signup" className="h-9 px-4 inline-flex items-center justify-center rounded-full bg-ink-900 text-white text-sm font-bold hover:bg-ink-700 transition shadow-soft shrink-0 whitespace-nowrap">
                無料で始める
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
