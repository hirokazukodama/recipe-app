'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractRecipe } from '@/actions/recipe'
import styles from './import.module.css'
import { Sparkles, AlertCircle, Link, Type } from 'lucide-react'

export default function ImportPage() {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<'text' | 'url'>('url')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleExtract = async () => {
    const input = mode === 'text' ? text : url
    if (!input.trim()) return

    setLoading(true)
    setError(null)

    const result = await extractRecipe(input)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.data) {
      // プレビュー用にデータを保存して遷移
      localStorage.setItem('temp_extracted_recipe', JSON.stringify(result.data))
      router.push('/import/preview')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>AIがレシピを解析中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>New Recipe</h1>
      <p className={styles.description}>
        レシピサイトのURL、YouTubeのリンク、またはテキストを直接入力してください。<br />
        Geminiが構造化データへと自動で解析します。
      </p>

      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tab} ${mode === 'url' ? styles.activeTab : ''}`}
          onClick={() => setMode('url')}
        >
          <Link size={18} />
          URL / YouTube
        </button>
        <button 
          className={`${styles.tab} ${mode === 'text' ? styles.activeTab : ''}`}
          onClick={() => setMode('text')}
        >
          <Type size={18} />
          テキスト
        </button>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid #ef4444', 
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className={styles.card}>
        {mode === 'text' ? (
          <textarea
            className={styles.textarea}
            placeholder="ここにレシピテキストを貼り付けてください..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className={styles.urlInputContainer}>
            <input
              className={styles.urlInput}
              type="url"
              placeholder="https://www.youtube.com/watch?v=... またはレシピサイトのURL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
            />
            <p className={styles.urlHint}>
              ※YouTubeの場合、説明欄と字幕から情報を抽出します。
            </p>
          </div>
        )}
        
        <button 
          className={styles.button}
          onClick={handleExtract}
          disabled={(mode === 'text' ? !text.trim() : !url.trim()) || loading}
        >
          <Sparkles size={20} />
          AIで解析する
        </button>
      </div>
    </div>
  )
}
