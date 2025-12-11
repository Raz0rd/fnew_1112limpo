'use client'

import { useState, useEffect } from 'react'
import { Shield, FileText, Info, ExternalLink } from 'lucide-react'
import Script from 'next/script'

interface WhitePageProps {
  onActivate: () => void
  isBot?: boolean
}

export default function WhitePage({ onActivate, isBot = false }: WhitePageProps) {
  const [showTestButton, setShowTestButton] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ''
  const googleAdsEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === 'true'

  // Verificar parâmetro secreto na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('test_conversion') === 'secret123') {
        setShowTestButton(true)
      }
    }
  }, [])

  // Função para disparar conversão de teste
  const handleTestConversion = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const conversionLabel = process.env.NEXT_PUBLIC_GTAG_CONVERSION_COMPRA || ''
      console.log('🧪 [TEST] Disparando conversão de teste...')
      console.log('🧪 [TEST] Google Ads ID:', googleAdsId)
      console.log('🧪 [TEST] Conversion Label:', conversionLabel)
      
      ;(window as any).gtag('event', 'conversion', {
        send_to: `${googleAdsId}/${conversionLabel}`,
        value: 100.00,
        currency: 'BRL',
        transaction_id: 'TEST_' + Date.now()
      })
      
      alert('✅ Conversão de teste disparada! Verifique o Google Ads Tag Assistant.')
    } else {
      alert('❌ Google Tag não carregado ainda. Aguarde alguns segundos e tente novamente.')
    }
  }

  const handleAccept = () => {
    setHasAccepted(true)
    
    // Redirecionar para blog externo
    setTimeout(() => {
      window.location.href = 'https://www.incogaming.com.br/blog/categories/free-fire'
    }, 500)
  }

  return (
    <>
      {/* Google Tag Manager */}
      {googleAdsEnabled && googleAdsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAdsId}');
            `}
          </Script>
        </>
      )}
      
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          {!hasAccepted ? (
            /* Política de Privacidade */
            <div className="py-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                    Política de Privacidade
                  </h1>
                  <p className="text-gray-600">
                    Informações sobre nosso serviço
                  </p>
                </div>

                {/* Conteúdo */}
                <div className="space-y-6 text-gray-700 mb-8">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-black mb-2">Sobre Nosso Serviço</h3>
                      <p className="text-sm leading-relaxed">
                        Somos uma plataforma de indicação que conecta usuários interessados em conteúdo sobre jogos digitais. 
                        Não realizamos vendas diretas, apenas facilitamos o acesso a informações e conteúdos relevantes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-black mb-2">Proteção de Dados Pessoais (LGPD)</h3>
                      <p className="text-sm leading-relaxed">
                        Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), informamos que 
                        <strong className="text-black"> não coletamos dados pessoais identificáveis</strong> como nome, e-mail, 
                        CPF, telefone ou endereço. Coletamos apenas dados anônimos de navegação (páginas visitadas, tempo de 
                        permanência, dispositivo utilizado) para fins estatísticos e melhoria da experiência do usuário.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-black mb-2">Conformidade com Google Ads</h3>
                      <p className="text-sm leading-relaxed">
                        Este site está em conformidade com as políticas do Google Ads. Utilizamos cookies e tecnologias 
                        semelhantes apenas para análise de tráfego e publicidade. Nenhum dado pessoal sensível é armazenado 
                        ou compartilhado com terceiros. Ao continuar, você concorda com nossa política de privacidade.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ExternalLink className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-black mb-2">Conteúdo e Redirecionamento</h3>
                      <p className="text-sm leading-relaxed">
                        Ao aceitar, você terá acesso a conteúdo informativo sobre Free Fire. 
                        Todo o conteúdo é fornecido por parceiros oficiais e sites autorizados. Podemos redirecionar você 
                        para sites de terceiros, onde suas próprias políticas de privacidade se aplicam.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão de Aceitar */}
                <button
                  onClick={handleAccept}
                  disabled={hasAccepted}
                  className="w-full bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {hasAccepted ? 'Redirecionando...' : 'Aceitar e Continuar'}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Ao clicar em "Aceitar e Continuar", você concorda com nossos termos de uso
                </p>
              </div>
            </div>
          ) : (
            /* Redirecionando */
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 animate-pulse">
                  <ExternalLink className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600">Redirecionando...</p>
              </div>
            </div>
          )}

          {/* Botão de teste (oculto) */}
          {showTestButton && (
            <button
              onClick={handleTestConversion}
              className="mt-4 w-full bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
            >
              🧪 Disparar Conversão de Teste (Google Ads)
            </button>
          )}
        </div>
      </div>
    </>
  )
}
