'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Gerenciamento condicional de tags do Google Ads
 * Controla quando as tags devem ser carregadas baseado na página atual
 */

type PageType = 'inicial' | 'loja' | 'sucesso' | 'outra'

export default function GoogleTagConditional() {
  const pathname = usePathname()
  const [pageType, setPageType] = useState<PageType | null>(null)
  
  // Determinar tipo de página
  useEffect(() => {
    if (pathname === '/success' || pathname === '/sucesso') {
      setPageType('sucesso')
      return
    }
    
    if (pathname === '/') {
      const whitePagePassed = localStorage.getItem('whitepage_passed')
      setPageType(whitePagePassed ? 'loja' : 'inicial')
    } else {
      setPageType('outra')
    }
  }, [pathname])
  
  // Cleanup de scripts quando necessário
  useEffect(() => {
    if (pageType === 'loja' || pageType === 'sucesso') {
      const scripts = document.querySelectorAll('script[src*="googletagmanager.com"], script[id*="google-gtag"]')
      scripts.forEach(script => script.remove())
      
      // @ts-ignore
      if (window.dataLayer) window.dataLayer = []
      // @ts-ignore
      if (window.gtag) window.gtag = () => {}
    }
  }, [pageType])

  const googleAdsEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === 'true'
  const googleAdsIds = process.env.NEXT_PUBLIC_GOOGLE_ADS_IDS || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  
  if (!googleAdsEnabled || !googleAdsIds) {
    return null
  }
  
  if (pageType === 'loja' || pageType === 'sucesso') {
    return null
  }

  // Separar múltiplas tags (suporta vírgula ou apenas uma tag)
  const adsIdArray = googleAdsIds.split(',').map(id => id.trim()).filter(id => id)
  const primaryAdsId = adsIdArray[0] // Primeira tag para carregar o script

  return (
    <>
      <script
        id="google-gtag-ssr"
        defer
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryAdsId}`}
      />
      <script
        id="google-gtag-init-ssr"
        defer
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${adsIdArray.map(id => `gtag('config', '${id}');`).join('\n            ')}
          `
        }}
      />
    </>
  )
}
