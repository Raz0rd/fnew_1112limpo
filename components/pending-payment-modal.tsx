"use client"

import React from "react"

interface PendingPaymentModalProps {
  isOpen: boolean
  onContinue: () => void
  onStartNew: () => void
}

export default function PendingPaymentModal({ isOpen, onContinue, onStartNew }: PendingPaymentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Pagamento Pendente</h3>
                <p className="text-sm text-gray-600">Você tem um pagamento em andamento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4 bg-white">
          <p className="text-gray-700 text-center">
            Detectamos que você tem um pagamento PIX pendente. Deseja continuar de onde parou?
          </p>

          {/* Botões */}
          <div className="space-y-3 pt-4">
            {/* Botão Continuar */}
            <button
              onClick={onContinue}
              className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-300"
            >
              Sim, continuar pagamento
            </button>

            {/* Botão Novo Pagamento */}
            <button
              onClick={onStartNew}
              className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all duration-300 border border-gray-300"
            >
              Não, fazer nova recarga
            </button>
          </div>

          {/* Info adicional */}
          <p className="text-xs text-gray-500 text-center pt-2">
            O QR Code anterior ainda está válido se não expirou
          </p>
        </div>
      </div>
    </div>
  )
}
