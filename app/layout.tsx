import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import HeadManager from "@/components/HeadManager"
import ClickTracker from "@/components/ClickTracker"
import DynamicTheme from "@/components/DynamicTheme"
import { DevToolsBlocker } from "@/components/DevToolsBlocker"
import AntiScraping from "@/components/AntiScraping"
import GoogleTagConditional from "@/components/GoogleTagConditional"

// Metadata para SEO - Whitepage (Free Fire)
export const metadata: Metadata = {
  title: "Diamantes FF Grátis - Dicas Free Fire, Cupons e Promoções FF",
  description: "Dicas exclusivas de Free Fire, cupons de diamantes grátis, promoções FF e estratégias para melhorar seu jogo. Aproveite eventos e ganhe recompensas!",
  keywords: [
    "diamantes ff grátis",
    "dicas free fire",
    "cupons ff",
    "promoções free fire",
    "eventos ff",
    "free fire dicas",
    "como ganhar diamantes ff",
    "cupons free fire grátis",
    "recarga free fire",
    "comprar diamantes free fire", 
    "diamantes free fire barato",
    "free fire recarga oficial",
    "site recarga free fire",
    "diamantes ff",
    "recarga ff oficial",
    "recarga delta force",
    "comprar creditos delta force",
    "delta force recarga oficial",
    "site recarga delta force",
    "recarga haikyu",
    "comprar moedas haikyu",
    "haikyu recarga oficial",
    "site recarga haikyu",
    "recarga jogo",
    "site de recarga de jogos",
    "recarga jogos mobile",
    "comprar creditos jogos",
    "recarga oficial jogos",
    "centro de recarga",
    "recarga segura jogos",
    "recarga rapida jogos",
    "bonus recarga jogos",
    "promocao recarga jogos"
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* DNS Prefetch para origens externas */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://cdn.utmify.com.br" />
        <link rel="dns-prefetch" href="https://api.ipify.org" />
        <link rel="dns-prefetch" href="https://api6.ipify.org" />
        <link rel="dns-prefetch" href="https://tracking.utmify.com.br" />
        
        {/* Preconnect apenas para as mais críticas */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        
        {/* Preload de fontes críticas */}
        <link 
          rel="preload" 
          href="/fonts/Metropolis-Regular-e920e6b0.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          href="/fonts/Metropolis-Bold-9a712a2c.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        
        {/* Noscript no head para funcionar sem JavaScript */}
        <noscript>
          <iframe 
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17731323187'}`}
            height="0" 
            width="0" 
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>
      </head>
      <body className="font-sans">
        {/* Google Tag - APENAS em / e /success */}
        <GoogleTagConditional />

        <HeadManager />
        <DynamicTheme />
        <DevToolsBlocker />
        <AntiScraping>
          <ClickTracker>
            <Suspense fallback={null}>{children}</Suspense>
          </ClickTracker>
        </AntiScraping>
      </body>
    </html>
  )
}
