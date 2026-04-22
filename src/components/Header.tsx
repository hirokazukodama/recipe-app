'use client'

import Link from 'next/link'
import styles from './header.module.css'
import { Plus, LayoutGrid } from 'lucide-react'

export default function Header() {
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
          <Link href="/import" className={styles.addButton}>
            <Plus size={18} />
            <span>レシピを追加</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
