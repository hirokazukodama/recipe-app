'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Step {
  id: string
  content?: string
  text?: string
}

interface CookingModeOverlayProps {
  isOpen: boolean
  onClose: () => void
  recipe: {
    title: string
    image_url?: string
  }
  steps: Step[]
}

export default function CookingModeOverlay({ isOpen, onClose, recipe, steps }: CookingModeOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const wakeLockRef = useRef<any>(null)
  
  // スワイプ操作用のステート
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrev()
    }
  }

  const goToNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else if (currentStepIndex === steps.length - 1) {
      // 完了時の処理
      fireConfetti()
    }
  }

  const goToPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const fireConfetti = () => {
    const duration = 3 * 1000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E65F4D', '#3A6B4C', '#FFD700']
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E65F4D', '#3A6B4C', '#FFD700']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  // WakeLockの管理
  useEffect(() => {
    if (!isOpen) return

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err: any) {
        console.warn(`WakeLock Error: ${err.message}`)
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isOpen])

  // キーボード操作の管理
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStepIndex, steps.length])

  // スクロールロック
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setCurrentStepIndex(0) // 閉じたらリセット
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentStep = steps[currentStepIndex]
  const stepText = currentStep?.content || currentStep?.text || ''
  
  // プログレスバーの計算
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100

  return (
    <div 
      className="fixed inset-0 z-50 bg-ink-900 text-white flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-ink-900/80 backdrop-blur z-10 absolute top-0 left-0 right-0">
        <div className="text-sm font-bold opacity-80 truncate px-4">
          {recipe.title}
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-20">
        <div 
          className="h-full bg-coral-500 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Media Half (Upper) */}
      <div className="flex-1 min-h-0 bg-black flex flex-col justify-center relative">
        {recipe.image_url ? (
          <img 
            src={recipe.image_url.startsWith('http') ? recipe.image_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/${recipe.image_url}`} 
            alt={recipe.title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-ink-800 flex items-center justify-center">
            <span className="text-white/20 font-bold text-2xl">No Image</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-ink-900 to-transparent" />
      </div>

      {/* Step Content Half (Lower) */}
      <div className="flex-1 min-h-0 bg-ink-900 flex flex-col px-6 sm:px-12 pt-8 pb-12 sm:pb-20 relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-full bg-coral-500 flex items-center justify-center font-bold text-lg">
            {currentStepIndex + 1}
          </span>
          <span className="text-ink-300 font-medium">
            / {steps.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <p className="text-2xl sm:text-4xl leading-relaxed sm:leading-[1.6] font-bold">
            {stepText}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-6 left-0 w-full px-6 sm:px-12 flex justify-between items-center pointer-events-none">
          <button 
            onClick={goToPrev}
            disabled={currentStepIndex === 0}
            className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentStepIndex === 0 ? 'opacity-0 scale-90' : 'bg-white/10 hover:bg-white/20 opacity-100 scale-100'
            }`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={goToNext}
            className={`pointer-events-auto flex items-center justify-center h-14 rounded-full px-8 font-bold text-lg transition-all shadow-cta ${
              currentStepIndex === steps.length - 1 
                ? 'bg-forest-500 hover:bg-forest-600 gap-2' 
                : 'bg-coral-500 hover:bg-coral-600'
            }`}
          >
            {currentStepIndex === steps.length - 1 ? (
              <>
                <Check className="w-6 h-6" />
                <span>完了！</span>
              </>
            ) : (
              <ChevronRight className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
