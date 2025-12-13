'use client'

import { useState, useEffect } from 'react'

export default function UserTrackingInfo() {
  const [trackingData, setTrackingData] = useState({
    params: {} as Record<string, string>,
    referer: '',
    ctax: '',
    isNewUser: false,
    timestamp: ''
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Capturar todos os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search)
    const params: Record<string, string> = {}
    urlParams.forEach((value, key) => {
      params[key] = value
    })

    // Capturar referer
    const referer = document.referrer || 'Direto (sem referer)'

    // Capturar ctax
    const ctax = urlParams.get('ctax') || 'Não encontrado'

    // Verificar se é usuário novo (primeira visita)
    const hasVisitedBefore = localStorage.getItem('user_visited')
    const isNewUser = !hasVisitedBefore
    
    if (!hasVisitedBefore) {
      localStorage.setItem('user_visited', 'true')
      localStorage.setItem('first_visit', new Date().toISOString())
    }

    // Timestamp atual
    const timestamp = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium'
    })

    setTrackingData({
      params,
      referer,
      ctax,
      isNewUser,
      timestamp
    })

    // Log no console para debug
    console.log('📊 [TRACKING INFO]')
    console.log('   - Timestamp:', timestamp)
    console.log('   - Usuário Novo:', isNewUser ? 'SIM' : 'NÃO')
    console.log('   - CTAX:', ctax)
    console.log('   - Referer:', referer)
    console.log('   - Params:', params)
  }, [])

  // Atalho de teclado para mostrar/esconder (Ctrl + Shift + T)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium transition-colors"
        title="Mostrar informações de tracking (Ctrl+Shift+T)"
      >
        📊 Tracking
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-blue-600 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-auto">
      <div className="sticky top-0 bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-sm">📊 Informações de Tracking</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 text-xl leading-none"
          title="Fechar (Ctrl+Shift+T)"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Timestamp */}
        <div>
          <div className="font-semibold text-gray-700 mb-1">⏰ Timestamp</div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200 font-mono">
            {trackingData.timestamp}
          </div>
        </div>

        {/* Usuário Novo */}
        <div>
          <div className="font-semibold text-gray-700 mb-1">👤 Tipo de Usuário</div>
          <div className={`p-2 rounded border font-semibold ${
            trackingData.isNewUser 
              ? 'bg-green-50 border-green-300 text-green-700' 
              : 'bg-blue-50 border-blue-300 text-blue-700'
          }`}>
            {trackingData.isNewUser ? '🆕 USUÁRIO NOVO' : '🔄 USUÁRIO RETORNANDO'}
          </div>
        </div>

        {/* CTAX */}
        <div>
          <div className="font-semibold text-gray-700 mb-1">🎯 CTAX (Google Customer ID)</div>
          <div className={`p-2 rounded border font-mono ${
            trackingData.ctax === 'Não encontrado'
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-green-50 border-green-300 text-green-700'
          }`}>
            {trackingData.ctax}
          </div>
        </div>

        {/* Referer */}
        <div>
          <div className="font-semibold text-gray-700 mb-1">🔗 Referer (De onde veio)</div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200 font-mono break-all">
            {trackingData.referer}
          </div>
        </div>

        {/* Parâmetros da URL */}
        <div>
          <div className="font-semibold text-gray-700 mb-1">📋 Parâmetros da URL</div>
          {Object.keys(trackingData.params).length > 0 ? (
            <div className="bg-gray-50 p-2 rounded border border-gray-200 space-y-1">
              {Object.entries(trackingData.params).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-semibold text-blue-600">{key}:</span>
                  <span className="font-mono text-gray-700 break-all">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-300 text-yellow-700">
              Nenhum parâmetro na URL
            </div>
          )}
        </div>

        {/* URL Completa */}
        <div>
          <div className="font-semibold text-gray-700 mb-1">🌐 URL Completa</div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200 font-mono text-[10px] break-all">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-gray-100 px-4 py-2 text-[10px] text-gray-600 border-t border-gray-200">
        💡 Pressione <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">Shift</kbd> + <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">T</kbd> para mostrar/esconder
      </div>
    </div>
  )
}
