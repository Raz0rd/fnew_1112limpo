"use client"

import { useState, useEffect } from "react"
import { X, Gift, ArrowLeft, Home } from "lucide-react"

interface ExitIntentModalProps {
  isOpen: boolean
  onClose: () => void
  onStay: () => void
  onGoHome: () => void
  hasDiscount: boolean
  discountCode?: string
  isLowQualityLead?: boolean
}

export default function ExitIntentModal({ 
  isOpen, 
  onClose, 
  onStay, 
  onGoHome, 
  hasDiscount,
  discountCode = "FF52188895",
  isLowQualityLead = false
}: ExitIntentModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden'
    } else {
      setIsAnimating(false)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen && !isAnimating) return null

  const handleStay = () => {
    onStay()
    onClose()
  }

  const handleGoHome = () => {
    onGoHome()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className={`relative text-white p-6 rounded-t-2xl ${
          isLowQualityLead 
            ? 'bg-gradient-to-r from-orange-500 to-red-600 animate-pulse' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isLowQualityLead ? '🚨 ÚLTIMA CHANCE!' : 'Espera aí! 🎁'}
              </h2>
              <p className="text-white/90 text-sm">
                {isLowQualityLead ? 'Oferta expirando AGORA!' : 'Não perca sua oportunidade'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasDiscount ? (
            <>
              <div className="text-center mb-6">
                <div className={`px-4 py-2 rounded-lg mb-4 font-medium ${
                  isLowQualityLead 
                    ? 'bg-red-100 text-red-800 animate-bounce' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isLowQualityLead ? '⚡ OFERTA RELÂMPAGO - APENAS AGORA!' : '🔥 OFERTA ESPECIAL - 5% OFF'}
                </div>
                <p className="text-gray-700 mb-2">
                  {isLowQualityLead 
                    ? 'Esta é sua ÚNICA chance de economizar!' 
                    : 'Você ainda não aplicou seu desconto!'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {isLowQualityLead 
                    ? `Código EXCLUSIVO: ` 
                    : 'Use o código '
                  }
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded font-bold">{discountCode}</span>
                  {isLowQualityLead ? ' - VÁLIDO POR 60 SEGUNDOS!' : ' e economize 5%'}
                </p>
              </div>

              <div className={`border rounded-lg p-4 mb-6 ${
                isLowQualityLead 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className={`flex items-center gap-2 font-medium mb-2 ${
                  isLowQualityLead ? 'text-red-800' : 'text-green-800'
                }`}>
                  <Gift size={16} />
                  {isLowQualityLead ? 'ÚLTIMOS SEGUNDOS:' : 'Vantagens de ficar:'}
                </div>
                <ul className={`text-sm space-y-1 ${
                  isLowQualityLead ? 'text-red-700' : 'text-green-700'
                }`}>
                  {isLowQualityLead ? (
                    <>
                      <li>• ⚡ Desconto EXCLUSIVO de 5%</li>
                      <li>• 🔥 Oferta NÃO será repetida</li>
                      <li>• ⏰ Expira em 60 segundos</li>
                    </>
                  ) : (
                    <>
                      <li>• 5% de desconto imediato</li>
                      <li>• Processo rápido e seguro</li>
                      <li>• Suporte 24/7</li>
                    </>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja sair?
                </p>
                <p className="text-sm text-gray-600">
                  Você já tem um desconto aplicado!
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleStay}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isLowQualityLead 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <ArrowLeft size={18} />
              {isLowQualityLead 
                ? '⚡ APLICAR DESCONTO AGORA!' 
                : hasDiscount 
                  ? 'Continuar Compra' 
                  : 'Aplicar Desconto e Continuar'
              }
            </button>
            
            <button
              onClick={handleGoHome}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isLowQualityLead 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Home size={18} />
              {isLowQualityLead ? 'Não, obrigado' : 'Ir para Início'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Esta oferta é válida apenas hoje!
          </p>
        </div>
      </div>
    </div>
  )
}
