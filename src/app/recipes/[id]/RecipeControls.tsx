'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRecipe } from '@/actions/recipe'
import Link from 'next/link'
import styles from './recipe-detail.module.css'
import { Edit2, Trash2 } from 'lucide-react'

interface Props {
  recipeId: string
}

export default function RecipeControls({ recipeId }: Props) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('このレシピを削除してもよろしいですか？')) return

    setDeleting(true)
    try {
      await deleteRecipe(recipeId)
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除に失敗しました。')
      setDeleting(false)
    }
  }

  return (
    <div className={styles.controls}>
      <Link href={`/recipes/${recipeId}/edit`} className={styles.editButton}>
        <Edit2 size={18} />
        編集
      </Link>
      <button 
        className={styles.deleteButton} 
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 size={18} />
        {deleting ? '削除中...' : '削除'}
      </button>
    </div>
  )
}
