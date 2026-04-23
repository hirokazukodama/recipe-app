'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { extractRecipe } from '@/actions/recipe'
import { Sparkles, AlertCircle, Link as LinkIcon, Type, ClipboardPaste, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<'url' | 'text'>('url')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 自動解析 (ペースト時)
  useEffect(() => {
    if (mode === 'url' && url.trim().startsWith('http')) {
      // ユーザーがペーストした場合、1秒待機後に自動開始
      const timer = setTimeout(() => {
        handleExtract(url)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [url, mode])

  const handleExtract = async (inputVal?: string) => {
    const input = inputVal || (mode === 'text' ? text : url)
    if (!input.trim()) return

    setLoading(true)
    setError(null)

    const result = await extractRecipe(input)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.data) {
      localStorage.setItem('temp_extracted_recipe', JSON.stringify(result.data))
      router.push('/import/preview')
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.startsWith('http')) {
        setMode('url')
        setUrl(text)
      } else {
        setMode('text')
        setText(text)
      }
    } catch (err) {
      console.error('Failed to read clipboard', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-cream-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white ring-1 ring-line p-8 flex flex-col items-center text-center shadow-soft animate-pulse">
          <div className="w-16 h-16 rounded-full bg-coral-50 flex place-items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 text-coral-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-ink-900 mb-2">レシピを解析中...</h2>
          <p className="text-sm text-ink-500">AIが材料と手順を整理しています</p>
          <div className="w-full h-2 bg-cream-100 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-coral-300 to-coral-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  const canSubmit = mode === 'text' ? text.trim().length > 0 : url.trim().length > 0

  return (
    <div className="min-h-[calc(100vh-56px)] bg-cream-50 py-12 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-black tracking-tight text-ink-900">新しいレシピを追加</h1>
          <p className="text-[15px] text-ink-500">
            URL を貼るか、テキストを直接入力してください<br/>
            AI が材料と手順を自動で整理します。
          </p>
        </div>

        <div className="bg-white ring-1 ring-line rounded-2xl overflow-hidden shadow-sm">
          <div className="flex p-1.5 gap-1 bg-cream-50 border-b border-line">
            <button 
              onClick={() => setMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold transition ${mode === 'url' ? 'bg-white text-ink-900 shadow-sm ring-1 ring-black/5' : 'text-ink-500 hover:text-ink-900 hover:bg-cream-100'}`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>リンクから</span>
            </button>
            <button 
              onClick={() => setMode('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold transition ${mode === 'text' ? 'bg-white text-ink-900 shadow-sm ring-1 ring-black/5' : 'text-ink-500 hover:text-ink-900 hover:bg-cream-100'}`}
            >
              <Type className="w-4 h-4" />
              <span>テキストから</span>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'url' ? (
              <div className="space-y-3">
                <input
                  type="url"
                  placeholder="https://... をここに貼り付け"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  className="w-full px-4 py-3 rounded-xl bg-cream-50 ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-coral-500 transition text-[15px] placeholder:text-ink-300"
                />
                <p className="text-[13px] text-ink-500">
                  ※YouTubeの場合、説明欄と字幕から抽出します。
                </p>
              </div>
            ) : (
              <textarea
                placeholder="材料や手順が書かれたテキストを貼り付けてください..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-cream-50 ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-coral-500 transition text-[15px] placeholder:text-ink-300 resize-none"
              />
            )}

            <button 
              onClick={() => handleExtract()}
              disabled={!canSubmit}
              className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition shadow-cta ${canSubmit ? 'bg-coral-500 hover:bg-coral-600 text-white' : 'bg-coral-100 text-coral-300 cursor-not-allowed shadow-none'}`}
            >
              <Sparkles className="w-5 h-5" />
              <span>✨ AI で解析する</span>
            </button>
          </div>
        </div>

        <button 
          onClick={handlePasteFromClipboard}
          className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-ink-500 hover:text-ink-900 hover:bg-cream-100 transition"
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>クリップボードから貼り付け</span>
        </button>
      </div>
    </div>
  )
}
