'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onGetOffer: () => void
  onRequestRefund: () => void
  showOfferButton?: boolean
}

export default function SuccessModal({ isOpen, onClose, onGetOffer, onRequestRefund, showOfferButton = true }: SuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white p-6 text-center border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {showOfferButton ? 'OFERTA EXCLUSIVA DE SKINS' : 'COMPRA APROVADA!'}
          </h2>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Parabéns, sua compra foi um sucesso!
          </h3>

          <p className="text-gray-700 text-center mb-4 leading-relaxed">
            Devido a grande demanda da promoção, a sua compra será processada e enviada no correio do jogo em <span className="font-bold">5-7 dias úteis</span>, caso você não queira esperar, você pode solicitar um reembolso apertando no botão abaixo.
          </p>

          {showOfferButton && (
            <p className="text-red-600 font-bold text-center mb-6">
              Também preparamos uma oferta exclusiva para você!!
            </p>
          )}

          {/* Botões */}
          <div className="space-y-3">
            {showOfferButton && (
              <button
                onClick={onGetOffer}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Obter oferta
              </button>
            )}

            <button
              onClick={onRequestRefund}
              className={`w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-all duration-200 ${!showOfferButton ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white' : ''}`}
            >
              {showOfferButton ? 'Solicitar um reembolso' : 'Voltar para o início'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
