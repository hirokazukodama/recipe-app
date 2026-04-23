'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './header.module.css'
import { Plus, LayoutGrid } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()

  // レシピ追加ボタンを表示しない条件
  const shouldHideAddButton = 
    pathname.startsWith('/auth/') || 
    pathname === '/import' || 
    pathname === '/import/preview' ||
    pathname.endsWith('/edit')

  return (
    <header className={styles.header}>
      <div className={`${styles.content} container`}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <LayoutGrid size={20} />
          </div>
          <span className={styles.logoText}>Recipe AI</span>
        </Link>
        <div className={styles.actions}>
          {!shouldHideAddButton && (
            <Link href="/import" className={styles.addButton}>
              <Plus size={18} />
              <span>レシピを追加</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
