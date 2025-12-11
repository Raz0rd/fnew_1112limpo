'use client'

import { useEffect, useState } from 'react'

export default function GoogleConversionTest() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const activateParam = urlParams.get('fireboost')
      
      if (activateParam === 'activar') {
        setIsVisible(true)
      }
    }
  }, [])

  const sendTestConversion = () => {
    setIsSending(true)
    setResult('')

    try {
      // Pegar variáveis do ambiente (SEM FALLBACK)
      const awId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
      const conversionLabel = process.env.NEXT_PUBLIC_GTAG_CONVERSION_COMPRA

      // Validar se as variáveis existem
      if (!awId || !conversionLabel) {
        setResult('❌ Erro: Variáveis de ambiente não configuradas!\n\nConfigure no .env:\nNEXT_PUBLIC_GOOGLE_ADS_ID\nNEXT_PUBLIC_GTAG_CONVERSION_COMPRA')
        setIsSending(false)
        return
      }

      // Gerar transaction_id aleatório
      const transactionId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const sendTo = `${awId}/${conversionLabel}`
      const testValue = 10.00 // Valor de teste

      // Verificar se gtag está disponível
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': sendTo,
          'value': testValue,
          'currency': 'BRL',
          'transaction_id': transactionId
        })

        setResult(`✅ Conversão enviada!\n\nAW ID: ${awId}\nLabel: ${conversionLabel}\nSend To: ${sendTo}\nTransaction ID: ${transactionId}\nValor: R$ ${testValue.toFixed(2)}`)
      } else {
        setResult('❌ Erro: gtag não está carregado na página')
      }
    } catch (error) {
      setResult(`❌ Erro ao enviar: ${error}`)
    } finally {
      setIsSending(false)
    }
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed bottom-4 right-4 max-w-sm"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 999999
      }}
    >
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🧪</span>
          <h3 className="font-bold text-lg">Teste de Conversão Google Ads</h3>
        </div>
        
        <p className="text-sm mb-4 opacity-90">
          Enviar conversão de teste para o Google Ads
        </p>

        <button
          onClick={sendTestConversion}
          disabled={isSending}
          className="w-full bg-white text-purple-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
              Enviando...
            </>
          ) : (
            <>
              <span>🚀</span>
              Enviar Conversão de Teste
            </>
          )}
        </button>

        {result && (
          <div className="mt-4 p-3 bg-white/10 rounded text-xs whitespace-pre-wrap">
            {result}
          </div>
        )}

        <div className="mt-4 text-xs opacity-75">
          <p>💡 Variáveis de ambiente:</p>
          <p>NEXT_PUBLIC_GOOGLE_ADS_ID</p>
          <p>NEXT_PUBLIC_GTAG_CONVERSION_COMPRA</p>
        </div>
      </div>
    </div>
  )
}
