"use client"

import { useState, useEffect } from "react"
import { X, Clock, Gift } from "lucide-react"

interface UrgencyBannerProps {
  onApplyDiscount: () => void
  hasDiscount: boolean
  isLowQualityLead?: boolean
}

export default function UrgencyBanner({ onApplyDiscount, hasDiscount, isLowQualityLead = false }: UrgencyBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos em segundos

  useEffect(() => {
    if (hasDiscount) {
      setIsVisible(false)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasDiscount])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible || hasDiscount) return null

  return (
    <div className={`text-white py-2 px-4 relative ${
      isLowQualityLead 
        ? 'bg-gradient-to-r from-orange-600 to-red-700 animate-bounce' 
        : 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse'
    }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-1">
          <Gift size={16} className="text-yellow-300" />
          <span className="font-medium">
            {isLowQualityLead 
              ? '🚨 ÚLTIMA CHANCE: 5% OFF expira em' 
              : '🔥 OFERTA LIMITADA: 5% OFF expira em'
            }
          </span>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded font-mono font-bold">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onApplyDiscount}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-3 py-1 rounded text-xs transition-colors"
          >
            APLICAR AGORA
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
