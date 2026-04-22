'use client'

import { useState } from 'react'
import styles from './recipe-detail.module.css'
import { scaleAmount, formatIngredientAmount } from '@/utils/recipe-utils'
import { 
  Utensils, 
  ListChecks 
} from "lucide-react";

interface Props {
  recipe: any
  sortedSteps: any[]
}

export default function RecipeDetailClient({ recipe, sortedSteps }: Props) {
  // 常に1人分からスタート
  const [targetServings, setTargetServings] = useState(1)

  const servingOptions = [1, 2, 3, 4]

  return (
    <div className={styles.infoGrid}>
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Utensils size={20} />
            材料
          </h2>
          
          <div className={styles.servingsSelector}>
            {servingOptions.map(num => (
              <button 
                key={num}
                className={`${styles.servingButton} ${targetServings === num ? styles.activeServing : ''}`}
                onClick={() => setTargetServings(num)}
              >
                {num}
              </button>
            ))}
            <span style={{ fontSize: '0.75rem', fontWeight: 700, marginRight: '0.5rem' }}>人分</span>
          </div>
        </div>

        <div className={styles.ingredientList}>
          {recipe.ingredients.map((ing: any) => {
            const scaled = scaleAmount(ing.amount_value, recipe.base_servings, targetServings)
            return (
              <div key={ing.id} className={styles.ingredientItem}>
                <span className={styles.ingredientName}>{ing.name}</span>
                <span className={styles.ingredientAmount}>
                  {formatIngredientAmount(scaled, ing.unit, ing.original_text, recipe.base_servings, targetServings)}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>
          <ListChecks size={20} />
          手順
        </h2>
        <div className={styles.stepList}>
          {sortedSteps.map((step: any) => (
            <div key={step.id} className={styles.stepItem}>
              <div className={styles.stepNumber}>{step.step_number}</div>
              <div className={styles.stepText}>{step.instruction}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
