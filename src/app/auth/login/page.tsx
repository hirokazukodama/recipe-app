'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '../actions'
import { AlertCircle, Eye, EyeOff, ChefHat, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden bg-cream-50">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-coral-100/40 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-forest-100/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-[380px] relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-coral-500 to-coral-700 shadow-soft flex items-center justify-center text-white">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-ink-900">おかえりなさい</h1>
          <p className="text-[15px] text-ink-500">アカウントにログインしてレシピを管理</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl ring-1 ring-white/50 border border-line rounded-3xl p-6 sm:p-8 shadow-soft">
          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-semibold text-ink-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full h-12 px-4 rounded-xl bg-white ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-coral-500 transition text-[15px] placeholder:text-ink-300"
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-semibold text-ink-700">
                  パスワード
                </label>
                <a href="#" className="text-[12px] font-medium text-coral-600 hover:text-coral-700">
                  お忘れですか？
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-4 pr-11 rounded-xl bg-white ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-coral-500 transition text-[15px] placeholder:text-ink-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-300 hover:text-ink-500 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-white font-semibold transition shadow-cta flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'ログイン中...' : 'ログイン'}</span>
            </button>
          </form>

          <div className="mt-8 text-center text-[14px] text-ink-500">
            アカウントをお持ちではありませんか？{' '}
            <Link href="/auth/signup" className="font-semibold text-coral-600 hover:text-coral-700 transition">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
