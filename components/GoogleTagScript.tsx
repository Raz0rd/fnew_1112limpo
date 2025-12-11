'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

/**
 * Componente para injetar Google Tag diretamente no HTML
 * Aparece no source da página (não via JavaScript)
 */
export default function GoogleTagScript() {
  const pathname = usePathname()
  
  // Carregar APENAS na página inicial (/) e sucesso (/success)
  const allowedPages = ['/', '/success']
  if (!allowedPages.includes(pathname)) {
    return null
  }

  const googleAdsEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === 'true'
  const googleAdsIds = process.env.NEXT_PUBLIC_GOOGLE_ADS_IDS || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  
  if (!googleAdsEnabled || !googleAdsIds) {
    return null
  }

  // Separar múltiplas tags (suporta vírgula ou apenas uma tag)
  const adsIdArray = googleAdsIds.split(',').map(id => id.trim()).filter(id => id)
  const primaryAdsId = adsIdArray[0] // Primeira tag para carregar o script

  return (
    <>
      {/* Google Tag Manager - aparece no source */}
      <Script
        id="google-gtag-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryAdsId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-gtag-init"
        strategy="afterInteractive"
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
